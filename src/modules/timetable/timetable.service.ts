import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

import * as sysMsg from '../../constants/system.messages';
import { ClassStudentModelAction } from '../class/model-actions/class-student.action';
import { ClassTeacherModelAction } from '../class/model-actions/class-teacher.action';
import { ClassModelAction } from '../class/model-actions/class.actions';
import { NotificationService } from '../notification/services/notification.service';
import {
  NotificationType,
  NotificationMetadata,
} from '../notification/types/notification.types';

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
    private readonly notificationService: NotificationService,
    private readonly classStudentModelAction: ClassStudentModelAction,
    private readonly classTeacherModelAction: ClassTeacherModelAction,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
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
        room: dto.room_id ? { id: dto.room_id } : null,
        timetable: { id: timetable.id },
      },
      transactionOptions: { useTransaction: false },
    });

    delete schedule.timetable;

    // Trigger notification asynchronously
    this.notifyAffectedUsers(
      dto.class_id,
      'Timetable Update',
      `A new schedule has been added to your timetable.`,
      NotificationType.TIMETABLE_CHANGE,
      { timetable_id: schedule.id, class_id: dto.class_id },
    ).catch((err) => {
      // Log error but don't block response
      this.logger.error('Failed to send timetable notifications', err);
    });

    return schedule;
  }

  private async notifyAffectedUsers(
    classId: string,
    title: string,
    message: string,
    type: NotificationType,
    metadata?: NotificationMetadata,
  ) {
    try {
      // 1. Get students with parents
      const students = await this.classStudentModelAction.list({
        filterRecordOptions: { class: { id: classId }, is_active: true },
        relations: { student: { user: true, parent: { user: true } } },
      });

      // 2. Get teachers
      const teachers = await this.classTeacherModelAction.list({
        filterRecordOptions: { class: { id: classId }, is_active: true },
        relations: { teacher: { user: true } },
      });

      const recipients = new Set<string>();

      // Add students and parents
      if (students.payload) {
        students.payload.forEach((cs) => {
          if (cs.student?.user?.id) recipients.add(cs.student.user.id);
          if (cs.student?.parent?.user?.id)
            recipients.add(cs.student.parent.user.id);
        });
      }

      // Add teachers
      if (teachers.payload) {
        teachers.payload.forEach((ct) => {
          if (ct.teacher?.user?.id) recipients.add(ct.teacher.user.id);
        });
      }

      // Send notifications
      await Promise.all(
        Array.from(recipients).map((userId) =>
          this.notificationService.createNotification(
            userId,
            title,
            message,
            type,
            metadata,
          ),
        ),
      );
    } catch (error) {
      this.logger.error('Error in notifyAffectedUsers:', error);
    }
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

      if (schedule.room) {
        mappedSchedule.room = {
          id: schedule.room.id,
          name: schedule.room.name,
          capacity: schedule.room.capacity,
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

    // Fetch schedule with timetable to get class_id for notification

    this.scheduleModelAction
      .get({
        identifierOptions: { id: scheduleId },
        relations: { timetable: true },
      })
      .then((schedule) => {
        if (schedule && schedule.timetable) {
          this.notifyAffectedUsers(
            schedule.timetable.class_id,
            'Timetable Update',
            `A schedule in your timetable has been updated.`,
            NotificationType.TIMETABLE_CHANGE,
            {
              timetable_id: schedule.id,
              class_id: schedule.timetable.class_id,
            },
          ).catch((err) =>
            this.logger.error('Failed to send notifications', err),
          );
        }
      });

    return updatedSchedule;
  }

  async unassignRoom(scheduleId: string) {
    // Check if schedule exists
    const schedule = await this.scheduleModelAction.get({
      identifierOptions: { id: scheduleId },
    });

    if (!schedule) {
      throw new BadRequestException(sysMsg.SCHEDULE_NOT_FOUND);
    }

    // Update the schedule to remove room assignment
    const updatedSchedule = await this.scheduleModelAction.update({
      updatePayload: { room_id: null },
      identifierOptions: { id: scheduleId },
      transactionOptions: { useTransaction: false },
    });

    // Remove timetable relation from response
    delete updatedSchedule.timetable;
    return {
      message: sysMsg.ROOM_UNASSIGNED_SUCCESSFULLY,
      ...updatedSchedule,
    };
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
