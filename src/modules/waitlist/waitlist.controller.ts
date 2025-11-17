import { Controller, Get, Param, Delete } from '@nestjs/common';
import { WaitlistService } from './waitlist.service';

@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Get()
  findAll() {
    return this.waitlistService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.waitlistService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.waitlistService.remove(+id);
  }
}
