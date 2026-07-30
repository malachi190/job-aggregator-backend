import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { User } from 'generated/prisma/client';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { FeedService } from 'src/feed/feed.service';

@Controller('profiles')
@UseGuards(AuthGuard)
export class ProfilesController {
  constructor(
    private readonly profileService: ProfilesService,
    private readonly feedService: FeedService,
  ) {}

  @Get('me')
  getMyProfile(@CurrentUser() user: User) {
    return this.profileService.findById(user.id);
  }

  @Patch('me')
  async updateMyProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdateProfileDto,
  ) {
    const profile = await this.profileService.updateByUserId(user.id, dto);
    await this.feedService.invalidateFeedCache(user.id);
    return profile;
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMyProfile(@CurrentUser() user: User) {
    await this.profileService.deleteByUserId(user.id);
  }
}
