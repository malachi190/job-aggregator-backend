import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, UseGuards } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { User } from 'generated/prisma/client';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@Controller('profiles')
@UseGuards(AuthGuard)
export class ProfilesController {
  constructor(private readonly profileService: ProfilesService) {}

  @Get('me')
  getMyProfile(@CurrentUser() user: User) {
    return this.profileService.findById(user.id);
  }

  @Patch('me')
  updateMyProfile(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.profileService.updateByUserId(user.id, dto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMyProfile(@CurrentUser() user: User) {
    await this.profileService.deleteByUserId(user.id);
  }
}
