import {
  Inject,
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/interfaces/storage.interface';
import { CreateBaseCvDto } from './dto/base_cv.dto';
import { Plan } from 'generated/prisma/enums';
import { CvParserService } from './services/cv-parser.service';

const FREE_TIER_BASE_CV_LIMIT = 3;

@Injectable()
export class BaseCvsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cvParser: CvParserService,
    @Inject('STORAGE_SERVICE') private readonly storage: StorageService,
  ) {}

  async findAllByUserId(userId: string) {
    return this.prisma.baseCv.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    userId: string,
    file: Express.Multer.File,
    dto: CreateBaseCvDto,
  ) {
    const count = await this.prisma.baseCv.count({ where: { userId } });
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    const limit =
      subscription?.plan === Plan.PAID ? Infinity : FREE_TIER_BASE_CV_LIMIT;

    if (count >= limit) {
      throw new ForbiddenException(
        `Base CV limit reached (${limit}). Upgrade to add more.`,
      );
    }

    // Parse the file BEFORE uploading (we have the buffer)
    const parsedData = await this.cvParser.parse(file.buffer, file.mimetype);

    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storageKey = `base-cvs/${userId}/${crypto.randomUUID()}-${sanitized}`;

    const fileUrl = await this.storage.upload(
      file.buffer,
      storageKey,
      file.mimetype,
    );

    // If this is the first CV, force it as default
    const isDefault = count === 0 ? true : dto.isDefault;

    if (isDefault) {
      await this.prisma.baseCv.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const baseCv = await this.prisma.baseCv.create({
      data: {
        userId,
        name: dto.name,
        fileUrl,
        storageKey,
        fileType: file.mimetype,
        fileSize: file.size,
        parsedData,
        isDefault,
      },
    });

    return baseCv;
  }

  async setDefault(userId: string, cvId: string) {
    const cv = await this.prisma.baseCv.findFirst({
      where: { id: cvId, userId },
    });

    if (!cv) {
      throw new NotFoundException('CV not found');
    }

    await this.prisma.baseCv.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });

    return this.prisma.baseCv.update({
      where: { id: cvId },
      data: { isDefault: true },
    });
  }

  async delete(userId: string, cvId: string) {
    const cv = await this.prisma.baseCv.findFirst({
      where: { id: cvId, userId },
    });

    if (!cv) {
      throw new NotFoundException('CV not found');
    }

    await this.storage.delete(cv.storageKey);
    await this.prisma.baseCv.delete({ where: { id: cvId } });

    // If we deleted the default and others remain, set the newest as default
    if (cv.isDefault) {
      const next = await this.prisma.baseCv.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      if (next) {
        await this.prisma.baseCv.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }
  }
}
