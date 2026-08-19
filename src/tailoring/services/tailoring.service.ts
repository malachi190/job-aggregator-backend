import {
  Inject,
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import Redis from 'ioredis';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/interfaces/storage.interface';
import {
  AIPROVIDER,
  TailoredContent,
} from '../../ai/interfaces/ai-provider.interface';
import { DocxGeneratorService } from './docx-generator.service';
import { Plan } from 'generated/prisma/client';

const FREE_TAILORING_LIMIT = 3;
const SESSION_TTL = 1800; // 30 minutes

interface TailoringSession {
  userId: string;
  baseCvId: string;
  jobId: string;
  content: TailoredContent;
  feedbackHistory: string[];
  createdAt: string;
}

@Injectable()
export class TailoringService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    @Inject('STORAGE_SERVICE') private readonly storage: StorageService,
    @Inject('GEMINI_PROVIDER') private readonly ai: AIPROVIDER,
    private readonly docxGenerator: DocxGeneratorService,
  ) {}

  async generate(userId: string, baseCvId: string, jobId: string) {
    const [baseCv, job, profile] = await Promise.all([
      this.prisma.baseCv.findFirst({ where: { id: baseCvId, userId } }),
      this.prisma.job.findUnique({ where: { id: jobId } }),
      this.prisma.profile.findUnique({ where: { userId } }),
    ]);

    if (!baseCv) throw new NotFoundException('Base CV not found');
    if (!job) throw new NotFoundException('Job not found');
    if (!profile) throw new BadRequestException('Complete your profile first');

    // extract text from parsed data, in cv;
    const MAX_CV_LENGTH = 15000; // characters
    const baseCvText = this.extractTextFromParsedData(baseCv.parsedData);
    const trimmedCv =
      baseCvText.length > MAX_CV_LENGTH
        ? baseCvText.substring(0, MAX_CV_LENGTH) +
          '\n[... additional experience truncated for brevity ...]'
        : baseCvText;

    const content = await this.ai.generateTailoredCv(
      trimmedCv,
      job.description,
      profile,
      job,
    );

    const sessionId = crypto.randomUUID();
    const session: TailoringSession = {
      userId,
      baseCvId,
      jobId,
      content,
      feedbackHistory: [],
      createdAt: new Date().toISOString(),
    };

    await this.redis.setex(
      `tailoring:session:${sessionId}`,
      SESSION_TTL,
      JSON.stringify(session),
    );

    return { sessionId, content };
  }

  private extractTextFromParsedData(parsedData: unknown): string {
    if (!parsedData || typeof parsedData !== 'object') {
      return 'No parsed text available. Use profile skills and role to infer experience.';
    }

    const data = parsedData as Record<string, unknown>;
    if (typeof data.fullText === 'string' && data.fullText.trim().length > 0) {
      return data.fullText.trim();
    }

    return 'No parsed text available. Use profile skills and role to infer experience.';
  }

  async refine(sessionId: string, userId: string, feedback: string) {
    const raw = await this.redis.get(`tailoring:session:${sessionId}`);
    if (!raw) throw new NotFoundException('Session expired or not found');

    const session: TailoringSession = JSON.parse(raw);
    if (session.userId !== userId) throw new ForbiddenException();

    const refined = await this.ai.refineTailoredCv(session.content, feedback);

    session.content = refined;
    session.feedbackHistory.push(feedback);

    await this.redis.setex(
      `tailoring:session:${sessionId}`,
      SESSION_TTL,
      JSON.stringify(session),
    );

    return { sessionId, content: refined };
  }

  async accept(sessionId: string, userId: string) {
    const raw = await this.redis.get(`tailoring:session:${sessionId}`);
    if (!raw) throw new NotFoundException('Session expired or not found');

    const session: TailoringSession = JSON.parse(raw);
    if (session.userId !== userId) throw new ForbiddenException();

    if (
      !session.content?.cv?.title ||
      !session.content?.cv?.summary ||
      !session.content?.coverLetter?.body
    ) {
      throw new BadRequestException(
        'Session content is incomplete. Please regenerate.',
      );
    }

    // Billing gate
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    const used = subscription?.tailoringUsedThisPeriod ?? 0;
    const plan = subscription?.plan ?? Plan.FREE;

    if (plan === Plan.FREE && used >= FREE_TAILORING_LIMIT) {
      throw new ForbiddenException(
        `Free tier limit reached (${FREE_TAILORING_LIMIT} tailored applications/month). Upgrade to continue.`,
      );
    }

    // Generate docx files
    const [cvBuffer, coverBuffer] = await Promise.all([
      this.docxGenerator.generateCvDocx(session.content.cv),
      this.docxGenerator.generateCoverLetterDocx(session.content.coverLetter),
    ]);

    // Upload to R2
    const timestamp = Date.now();
    const cvKey = `applications/${userId}/${session.jobId}/cv-${timestamp}.docx`;
    const coverKey = `applications/${userId}/${session.jobId}/cover-${timestamp}.docx`;

    const [cvUrl, coverUrl] = await Promise.all([
      this.storage.upload(
        cvBuffer,
        cvKey,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ),
      this.storage.upload(
        coverBuffer,
        coverKey,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ),
    ]);

    // Create application record
    await this.prisma.$transaction(async (tx) => {
      await tx.subscription.upsert({
        where: { userId },
        create: {
          userId,
          plan: Plan.FREE,
          tailoringUsedThisPeriod: 1,
        },
        update: {
          tailoringUsedThisPeriod: { increment: 1 },
        },
      });

      tx.application.create({
        data: {
          userId,
          jobId: session.jobId,
          status: 'PENDING',
          cvDocUrl: cvUrl,
          coverLetterUrl: coverUrl,
        },
      });
    });

    // Create subscription record
    // await this.prisma.subscription.upsert({
    //   where: { userId },
    //   create: {
    //     userId,
    //     plan: Plan.FREE,
    //     tailoringUsedThisPeriod: 1,
    //   },
    //   update: {
    //     tailoringUsedThisPeriod: { increment: 1 },
    //   },
    // });

    // Clean up session
    await this.redis.del(`tailoring:session:${sessionId}`);

    return { cvUrl, coverLetterUrl: coverUrl };
  }
}
