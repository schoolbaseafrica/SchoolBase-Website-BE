import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Invite } from './entities/invites.entity';
import { InvitesController } from './invites.controller';
import { InviteService } from './invites.service';

@Module({
  imports: [TypeOrmModule.forFeature([Invite])],
  controllers: [InvitesController],
  providers: [InviteService],
  exports: [InviteService],
})
export class InviteModule {}
