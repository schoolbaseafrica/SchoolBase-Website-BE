import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import * as sysMsg from '../../../constants/system.messages';
import { StreamResponseDto } from '../dto/stream-response.dto';
import { Class } from '../entities/class.entity';
import { Stream } from '../entities/stream.entity';

@Injectable()
export class StreamService {
  constructor(
    @InjectRepository(Stream)
    private readonly streamRepository: Repository<Stream>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
  ) {}

  async getStreamsByClass(classId: string): Promise<StreamResponseDto[]> {
    // Validate Class Exists
    const classExists = await this.classRepository.findOne({
      where: { id: classId },
    });

    if (!classExists) {
      throw new NotFoundException(sysMsg.CLASS_NOT_FOUND);
    }

    // Fetch Streams with Student Relations
    const streams = await this.streamRepository.find({
      where: { class: { id: classId } },
      relations: ['students'],
      order: { name: 'ASC' },
    });

    // Map to DTO
    return streams.map((stream) => ({
      id: stream.id,
      name: stream.name,
      studentCount: stream.students?.length || 0,
    }));
  }
}
