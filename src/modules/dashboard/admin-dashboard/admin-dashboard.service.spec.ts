import { Logger } from 'winston';

import { TimetableModelAction } from '../../timetable/model-actions/timetable.model-action';

import { AdminDashboardService } from './admin-dashboard.service';

describe('AdminDashboardService', () => {
  let service: AdminDashboardService;
  let timetableModelAction: TimetableModelAction;
  let logger: Logger;

  beforeEach(() => {
    timetableModelAction = {
      list: jest.fn(),
    } as unknown as TimetableModelAction;
    logger = {
      child: () => logger,
      warn: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
    } as unknown as Logger;

    service = new AdminDashboardService(timetableModelAction, logger);
  });

  it('should load today activities with all data', async () => {
    const mockTimetables = [
      {
        id: 'timetable-1',
        class: { id: 'class-1', name: 'Form 1A' },
        schedules: [
          {
            id: 'schedule-1',
            day: new Date()
              .toLocaleDateString('en-US', { weekday: 'long' })
              .toUpperCase(),
            start_time: '08:00:00',
            end_time: '09:00:00',
            period_type: 'ACADEMICS',
            room: 'Room 101',
            teacher: {
              id: 'teacher-1',
              title: 'Mr.',
              user: { first_name: 'John', last_name: 'Doe' },
            },
            subject: { id: 'subject-1', name: 'Mathematics' },
          },
        ],
      },
    ];

    (timetableModelAction.list as jest.Mock).mockResolvedValue({
      payload: mockTimetables,
    });

    const result = await service.loadTodayActivities();

    expect(result).toHaveProperty('todays_activities');
    expect(result).toHaveProperty('summary');
    expect(result.todays_activities.length).toBe(1);
    expect(result.todays_activities[0].class.name).toBe('Form 1A');
    expect(result.todays_activities[0].subject?.name).toBe('Mathematics');
    expect(result.summary.total_activities).toBe(1);
  });

  it('should return empty array when no activities exist', async () => {
    (timetableModelAction.list as jest.Mock).mockResolvedValue({
      payload: [],
    });

    const result = await service.loadTodayActivities();

    expect(result.todays_activities).toEqual([]);
    expect(result.summary.total_activities).toBe(0);
  });

  it('should identify activities with no teacher', async () => {
    const mockTimetables = [
      {
        id: 'timetable-1',
        class: { id: 'class-1', name: 'Form 1A' },
        schedules: [
          {
            id: 'schedule-1',
            day: new Date()
              .toLocaleDateString('en-US', { weekday: 'long' })
              .toUpperCase(),
            start_time: '08:00:00',
            end_time: '09:00:00',
            period_type: 'ACADEMICS',
            room: 'Room 101',
            teacher: null,
            subject: { id: 'subject-1', name: 'Mathematics' },
          },
        ],
      },
    ];

    (timetableModelAction.list as jest.Mock).mockResolvedValue({
      payload: mockTimetables,
    });

    const result = await service.loadTodayActivities();

    expect(result.summary.activities_with_no_teacher).toBe(1);
  });

  it('should sort activities by start time', async () => {
    const mockTimetables = [
      {
        id: 'timetable-1',
        class: { id: 'class-1', name: 'Form 1A' },
        schedules: [
          {
            id: 'schedule-2',
            day: new Date()
              .toLocaleDateString('en-US', { weekday: 'long' })
              .toUpperCase(),
            start_time: '10:00:00',
            end_time: '11:00:00',
            period_type: 'ACADEMICS',
            room: null,
            teacher: null,
            subject: { id: 'subject-2', name: 'Science' },
          },
          {
            id: 'schedule-1',
            day: new Date()
              .toLocaleDateString('en-US', { weekday: 'long' })
              .toUpperCase(),
            start_time: '08:00:00',
            end_time: '09:00:00',
            period_type: 'ACADEMICS',
            room: null,
            teacher: null,
            subject: { id: 'subject-1', name: 'Math' },
          },
        ],
      },
    ];

    (timetableModelAction.list as jest.Mock).mockResolvedValue({
      payload: mockTimetables,
    });

    const result = await service.loadTodayActivities();

    expect(result.todays_activities[0].start_time).toBe('08:00:00');
    expect(result.todays_activities[1].start_time).toBe('10:00:00');
  });
});
