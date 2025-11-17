import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WaitlistService } from './waitlist.service';
import { WaitlistController } from './waitlist.controller';
import { Waitlist } from './entities/waitlist.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Waitlist])],
  controllers: [WaitlistController],
  providers: [WaitlistService],
})
export class WaitlistModule {}
