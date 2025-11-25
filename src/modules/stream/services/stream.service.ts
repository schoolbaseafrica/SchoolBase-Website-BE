import { Injectable, NotFoundException } from '@nestjs/common';

import * as sysMsg from '../../../constants/system.messages';
import { ClassModelAction } from '../../class/model-actions/class.actions';
import { StreamResponseDto } from '../dto/stream-response.dto';
import { StreamModelAction } from '../model-actions/stream.model-action';

@Injectable()
export class StreamService {
  constructor(
    private readonly streamModelAction: StreamModelAction,
    private readonly classModelAction: ClassModelAction,
  ) {}

  async getStreamsByClass(classId: string): Promise<StreamResponseDto[]> {
    const classExists = await this.classModelAction.get({
      identifierOptions: { id: classId },
    });

    if (!classExists) {
      throw new NotFoundException(sysMsg.CLASS_NOT_FOUND);
    }

    const { payload: streams } = await this.streamModelAction.list({
      filterRecordOptions: { class_id: classId },

      relations: { students: true },

      paginationPayload: { page: 1, limit: 500 },
      order: { name: 'ASC' },
    });

    // 3. Map to DTO
    return streams.map((stream) => ({
      id: stream.id,
      name: stream.name,
      student_count: stream.students?.length || 0,
    }));
  }
}
