import { Module } from '@nestjs/common';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { AuthModule } from 'src/auth/auth.module';
import { FeedModule } from 'src/feed/feed.module';


@Module({
  imports: [AuthModule, FeedModule],
  controllers: [ProfilesController],
  providers: [ProfilesService]
})
export class ProfilesModule {}
