import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from 'generated/prisma/client';
import { TailoringService } from './services/tailoring.service';
import { GenerateTailoringDto } from './dto/generate-tailoring.dto';
import { RefineTailoringDto } from './dto/refine-tailoring.dto';

@Controller('tailoring')
@UseGuards(AuthGuard)
export class TailoringController {
  constructor(private readonly tailoringService: TailoringService) {}

  @Post('generate')
  async generate(@CurrentUser() user: User, @Body() dto: GenerateTailoringDto) {
    return this.tailoringService.generate(user.id, dto.baseCvId, dto.jobId);
  }

  @Post(':sessionId/refine')
  async refine(
    @CurrentUser() user: User,
    @Param('sessionId') sessionId: string,
    @Body() dto: RefineTailoringDto,
  ) {
    return this.tailoringService.refine(sessionId, user.id, dto.feedback);
  }

  @Post(':sessionId/accept')
  async accept(
    @CurrentUser() user: User,
    @Param('sessionId') sessionId: string,
  ) {
    return this.tailoringService.accept(sessionId, user.id);
  }
}
