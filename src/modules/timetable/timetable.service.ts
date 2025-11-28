import { Injectable, BadRequestException } from '@nestjs/common';

import * as sysMsg from '../../constants/system.messages';
import { ClassModelAction } from '../class/model-actions/class.actions';

import {
  AddScheduleDto,
  GetTimetableResponseDto,
  ScheduleResponseDto,
} from './dto/timetable.dto';
import { PeriodType } from './enums/timetable.enums';
import { ScheduleModelAction } from './model-actions/schedule.model-action';
import { TimetableModelAction } from './model-actions/timetable.model-action';
import { TimetableValidationService } from './services/timetable-validation.service';

@Injectable()
export class TimetableService {
  constructor(
    private readonly timetableModelAction: TimetableModelAction,
    private readonly validationService: TimetableValidationService,
    private readonly scheduleModelAction: ScheduleModelAction,
    private readonly classModelAction: ClassModelAction,
  ) {}

  async create() {
    // TODO: Uncomment when implementing create method
    // await this.validationService.validateTimetableRules(createTimetableDto);
    return 'returns create response';
  }

  async addSchedule(dto: AddScheduleDto) {
    if (dto.period_type === PeriodType.BREAK) {
      dto.teacher_id = null;
      dto.subject_id = null;
    } else {
      if (!dto.subject_id) {
        throw new BadRequestException(sysMsg.SUBJECT_REQUIRED_FOR_LESSON);
      }
    }
    await this.validationService.validateNewSchedule(dto);

    let timetable = await this.timetableModelAction.get({
      identifierOptions: { class_id: dto.class_id },
    });

    if (!timetable) {
      timetable = await this.timetableModelAction.create({
        createPayload: {
          class_id: dto.class_id,
          is_active: true,
        },
        transactionOptions: { useTransaction: false },
      });
    }

    const schedule = await this.scheduleModelAction.create({
      createPayload: {
        ...dto,
        timetable: { id: timetable.id },
      },
      transactionOptions: { useTransaction: false },
    });

    delete schedule.timetable;
    return schedule;
  }

  async findAll() {
    return 'returns findAll response';
  }

  async findByClass(classId: string): Promise<GetTimetableResponseDto> {
    const timetable =
      await this.timetableModelAction.findTimetableByClassId(classId);

    if (!timetable) {
      return {
        class_id: classId,
        schedules: [],
      };
    }

    const schedules = timetable.schedules.map((schedule) => {
      // Create a base schedule object without the teacher property first
      const { teacher, ...baseSchedule } = schedule;
      const mappedSchedule = {
        ...baseSchedule,
        teacher: undefined,
      } as unknown as ScheduleResponseDto;

      if (teacher && teacher.user) {
        mappedSchedule.teacher = {
          id: teacher.id,
          title: teacher.title,
          first_name: teacher.user.first_name,
          last_name: teacher.user.last_name,
        };
      }

      return mappedSchedule;
    });

    return {
      class_id: timetable.class_id,
      schedules: schedules,
    };
  }

  async findByTeacher() {
    return 'returns findByTeacher response';
  }

  async findOne() {
    return 'returns findOne response';
  }

  async update() {
    // TODO: Uncomment when implementing update method
    // await this.validationService.validateTimetableRules(updateTimetableDto);
    return 'returns update response';
  }

  async remove() {
    return 'returns remove response';
  }

  async archive() {
    return 'returns archive response';
  }
}
