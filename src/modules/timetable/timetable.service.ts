import { Injectable, BadRequestException } from '@nestjs/common';

import * as sysMsg from '../../constants/system.messages';
import { ClassModelAction } from '../class/model-actions/class.actions';

import {
  AddScheduleDto,
  GetTimetableResponseDto,
  ScheduleResponseDto,
  UpdateScheduleDto,
} from './dto/timetable.dto';
import { PeriodType, DayOfWeek } from './enums/timetable.enums';
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

  async editSchedule(scheduleId: string, dto: UpdateScheduleDto) {
    // Validate the update
    await this.validationService.validateUpdateSchedule(scheduleId, dto);

    // Update the schedule
    const updatedSchedule = await this.scheduleModelAction.update({
      updatePayload: dto,
      identifierOptions: { id: scheduleId },
      transactionOptions: { useTransaction: false },
    });

    // Remove timetable relation from response
    delete updatedSchedule.timetable;
    return updatedSchedule;
  }

  async archive() {
    return 'returns archive response';
  }

  async getAll(
    page = 1,
    limit = 20,
    day?: DayOfWeek,
  ): Promise<{
    data: GetTimetableResponseDto[];
    pagination: {
      total: number;
      limit: number;
      page: number;
      total_pages: number;
      has_next: boolean;
      has_previous: boolean;
    };
  }> {
    const timetables = await this.timetableModelAction.findAllTimetables();

    if (day && !Object.values(DayOfWeek).includes(day)) {
      throw new BadRequestException(
        `Invalid day '${day}'. Allowed values are: ${Object.values(DayOfWeek).join(', ')}`,
      );
    }

    // Filter schedules by day if provided
    let filteredTimetables = timetables;
    if (day) {
      filteredTimetables = timetables.map((timetable) => ({
        ...timetable,
        schedules: timetable.schedules.filter(
          (schedule) => schedule.day.toUpperCase() === day.toUpperCase(),
        ),
      }));
    }

    const total = filteredTimetables.length;
    const total_pages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedTimetables = filteredTimetables.slice(start, end);

    const data = paginatedTimetables.map((timetable) => ({
      class_id: timetable.class_id,
      name: timetable.class.name,
      arm: timetable.class.arm,
      schedules: timetable.schedules.map((schedule) => {
        const { teacher, ...baseSchedule } = schedule;
        return {
          ...baseSchedule,
          teacher: teacher?.user
            ? {
                id: teacher.id,
                title: teacher.title,
                first_name: teacher.user.first_name,
                last_name: teacher.user.last_name,
              }
            : undefined,
        };
      }),
    }));

    return {
      data,
      pagination: {
        total,
        limit,
        page,
        total_pages,
        has_next: page < total_pages,
        has_previous: page > 1,
      },
    };
  }
}
