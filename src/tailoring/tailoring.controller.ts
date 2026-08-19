import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from 'generated/prisma/client';
import { TailoringService } from './services/tailoring.service';
import { GenerateTailoringDto } from './dto/generate-tailoring.dto';
import { RefineTailoringDto } from './dto/refine-tailoring.dto';
import { Throttle } from '@nestjs/throttler';
import { RATE_LIMITS } from 'src/rate-limit/rate-limit.config';

@Controller('tailoring')
@UseGuards(AuthGuard)
export class TailoringController {
  constructor(private readonly tailoringService: TailoringService) {}

  @Post('generate')
  // @Throttle({ tailoring: RATE_LIMITS.tailoring })
  async generate(@CurrentUser() user: User, @Body() dto: GenerateTailoringDto) {
    return this.tailoringService.generate(user.id, dto.baseCvId, dto.jobId);
  }

  @Post(':sessionId/refine')
  // @Throttle({ tailoring: RATE_LIMITS.tailoring })
  async refine(
    @CurrentUser() user: User,
    @Param('sessionId') sessionId: string,
    @Body() dto: RefineTailoringDto,
  ) {
    return this.tailoringService.refine(sessionId, user.id, dto.feedback);
  }

  @Post(':sessionId/accept')
  // @Throttle({ tailoring: RATE_LIMITS.tailoring })
  async accept(
    @CurrentUser() user: User,
    @Param('sessionId') sessionId: string,
  ) {
    return this.tailoringService.accept(sessionId, user.id);
  }
}
