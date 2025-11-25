import { AbstractModelAction } from '@hng-sdk/orm'; // Import the base class
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Room } from '../entities/room.entity';

@Injectable()
export class RoomModelAction extends AbstractModelAction<Room> {
  constructor(
    @InjectRepository(Room)
    sessionRepository: Repository<Room>,
  ) {
    super(sessionRepository, Room);
  }
}
