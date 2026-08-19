import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BaseCvsService } from './base_cvs.service';
import { User } from 'generated/prisma/client';
import { CreateBaseCvDto } from './dto/base_cv.dto';
import { Throttle } from '@nestjs/throttler';
import { RATE_LIMITS } from 'src/rate-limit/rate-limit.config';

@Controller('base-cvs')
@UseGuards(AuthGuard)
export class BaseCvsController {
  constructor(private readonly baseCvsService: BaseCvsService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.baseCvsService.findAllByUserId(user.id);
  }

  @Post()
  // @Throttle({ upload: RATE_LIMITS.upload })
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @CurrentUser() user: User,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({
            fileType:
              /(pdf|vnd.openxmlformats-officedocument.wordprocessingml.document)/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() dto: CreateBaseCvDto,
  ) {
    return this.baseCvsService.create(user.id, file, dto);
  }

  @Patch(':id/default')
  setDefault(@CurrentUser() user: User, @Param('id') cvId: string) {
    return this.baseCvsService.setDefault(user.id, cvId);
  }

  @Delete(':id')
  // @Throttle({ upload: RATE_LIMITS.upload })
  async remove(@CurrentUser() user: User, @Param('id') cvId: string) {
    await this.baseCvsService.delete(user.id, cvId);
  }
}
