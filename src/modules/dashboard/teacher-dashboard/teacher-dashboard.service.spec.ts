import { Logger } from 'winston';

import { ScheduleModelAction } from '../../timetable/model-actions/schedule.model-action';

import { TeacherDashboardService } from './teacher-dashboard.service';

describe('TeacherDashboardService', () => {
    let service: TeacherDashboardService;
    let scheduleModelAction: ScheduleModelAction;
    let logger: Logger;

    beforeEach(() => {
        scheduleModelAction = {
            list: jest.fn(),
        } as unknown as ScheduleModelAction;

        logger = {
            child: () => logger,
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        } as unknown as Logger;

        service = new TeacherDashboardService(scheduleModelAction, logger);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getTodaysClasses', () => {
        const teacherId = 'teacher-123';
        // Get current day dynamically for tests
        const currentDay = new Date()
            .toLocaleDateString('en-US', { weekday: 'long' })
            .toUpperCase();

        it('should return todays classes sorted by start time', async () => {
            const mockSchedules = [
                {
                    id: 'schedule-2',
                    day: currentDay,
                    start_time: '10:00:00',
                    end_time: '11:00:00',
                    room: 'Room 202',
                    timetable: {
                        class: { id: 'class-2', name: 'Form 2A' },
                    },
                    subject: { id: 'subject-2', name: 'Physics' },
                },
                {
                    id: 'schedule-1',
                    day: currentDay,
                    start_time: '08:00:00',
                    end_time: '09:00:00',
                    room: 'Room 101',
                    timetable: {
                        class: { id: 'class-1', name: 'Form 1A' },
                    },
                    subject: { id: 'subject-1', name: 'Mathematics' },
                },
            ];

            (scheduleModelAction.list as jest.Mock).mockResolvedValue({
                payload: mockSchedules,
            });

            const result = await service.getTodaysClasses(teacherId);

            expect(result.total_classes).toBe(2);
            expect(result.todays_classes).toHaveLength(2);
            // Verify sorting
            expect(result.todays_classes[0].start_time).toBe('08:00:00');
            expect(result.todays_classes[1].start_time).toBe('10:00:00');
            expect(result.todays_classes[0].class_name).toBe('Form 1A');
        });

        it('should return empty array when no classes today', async () => {
            (scheduleModelAction.list as jest.Mock).mockResolvedValue({
                payload: [],
            });

            const result = await service.getTodaysClasses(teacherId);

            expect(result.total_classes).toBe(0);
            expect(result.todays_classes).toEqual([]);
        });

        it('should handle missing class metadata gracefully', async () => {
            const mockSchedules = [
                {
                    id: 'schedule-1',
                    day: currentDay,
                    start_time: '08:00:00',
                    end_time: '09:00:00',
                    room: 'Room 101',
                    timetable: null, // Missing class metadata
                    subject: { id: 'subject-1', name: 'Mathematics' },
                },
                {
                    id: 'schedule-2',
                    day: currentDay,
                    start_time: '10:00:00',
                    end_time: '11:00:00',
                    room: 'Room 202',
                    timetable: {
                        class: { id: 'class-2', name: 'Form 2A' },
                    },
                    subject: { id: 'subject-2', name: 'Physics' },
                },
            ];

            (scheduleModelAction.list as jest.Mock).mockResolvedValue({
                payload: mockSchedules,
            });

            const result = await service.getTodaysClasses(teacherId);

            // Should skip the one with missing metadata
            expect(result.total_classes).toBe(1);
            expect(result.todays_classes[0].class_name).toBe('Form 2A');
        });

        it('should deduplicate identical schedules', async () => {
            const mockSchedules = [
                {
                    id: 'schedule-1',
                    day: currentDay,
                    start_time: '08:00:00',
                    end_time: '09:00:00',
                    room: 'Room 101',
                    timetable: {
                        class: { id: 'class-1', name: 'Form 1A' },
                    },
                    subject: { id: 'subject-1', name: 'Mathematics' },
                },
                {
                    id: 'schedule-1', // Duplicate
                    day: currentDay,
                    start_time: '08:00:00',
                    end_time: '09:00:00',
                    room: 'Room 101',
                    timetable: {
                        class: { id: 'class-1', name: 'Form 1A' },
                    },
                    subject: { id: 'subject-1', name: 'Mathematics' },
                },
            ];

            (scheduleModelAction.list as jest.Mock).mockResolvedValue({
                payload: mockSchedules,
            });

            const result = await service.getTodaysClasses(teacherId);

            expect(result.total_classes).toBe(1);
            expect(logger.warn).toHaveBeenCalledWith(
                expect.stringContaining('Duplicate schedule detected'),
            );
        });

        it('should include all required fields in response', async () => {
            const mockSchedules = [
                {
                    id: 'schedule-1',
                    day: currentDay,
                    start_time: '08:00:00',
                    end_time: '09:00:00',
                    room: 'Room 101',
                    timetable: {
                        class: { id: 'class-1', name: 'Form 1A' },
                    },
                    subject: { id: 'subject-1', name: 'Mathematics' },
                },
            ];

            (scheduleModelAction.list as jest.Mock).mockResolvedValue({
                payload: mockSchedules,
            });

            const result = await service.getTodaysClasses(teacherId);

            const classDto = result.todays_classes[0];
            expect(classDto).toHaveProperty('schedule_id');
            expect(classDto).toHaveProperty('class_name');
            expect(classDto).toHaveProperty('class_id');
            expect(classDto).toHaveProperty('subject_name');
            expect(classDto).toHaveProperty('subject_id');
            expect(classDto).toHaveProperty('start_time');
            expect(classDto).toHaveProperty('end_time');
            expect(classDto).toHaveProperty('room');
        });

        it('should handle null room values', async () => {
            const mockSchedules = [
                {
                    id: 'schedule-1',
                    day: currentDay,
                    start_time: '08:00:00',
                    end_time: '09:00:00',
                    room: null,
                    timetable: {
                        class: { id: 'class-1', name: 'Form 1A' },
                    },
                    subject: { id: 'subject-1', name: 'Mathematics' },
                },
            ];

            (scheduleModelAction.list as jest.Mock).mockResolvedValue({
                payload: mockSchedules,
            });

            const result = await service.getTodaysClasses(teacherId);

            expect(result.todays_classes[0].room).toBeNull();
        });

        it('should handle missing subject (break period)', async () => {
            const mockSchedules = [
                {
                    id: 'schedule-1',
                    day: currentDay,
                    start_time: '10:00:00',
                    end_time: '10:15:00',
                    room: null,
                    timetable: {
                        class: { id: 'class-1', name: 'Form 1A' },
                    },
                    subject: null, // Break period
                },
            ];

            (scheduleModelAction.list as jest.Mock).mockResolvedValue({
                payload: mockSchedules,
            });

            const result = await service.getTodaysClasses(teacherId);

            expect(result.todays_classes[0].subject_name).toBe('Break');
            expect(result.todays_classes[0].subject_id).toBe('');
        });

        it('should log warning for overlapping sessions', async () => {
            const mockSchedules = [
                {
                    id: 'schedule-1',
                    day: currentDay,
                    start_time: '08:00:00',
                    end_time: '09:30:00', // Overlaps with next
                    room: 'Room 101',
                    timetable: {
                        class: { id: 'class-1', name: 'Form 1A' },
                    },
                    subject: { id: 'subject-1', name: 'Mathematics' },
                },
                {
                    id: 'schedule-2',
                    day: currentDay,
                    start_time: '09:00:00', // Starts before previous ends
                    end_time: '10:00:00',
                    room: 'Room 202',
                    timetable: {
                        class: { id: 'class-2', name: 'Form 2A' },
                    },
                    subject: { id: 'subject-2', name: 'Physics' },
                },
            ];

            (scheduleModelAction.list as jest.Mock).mockResolvedValue({
                payload: mockSchedules,
            });

            await service.getTodaysClasses(teacherId);

            expect(logger.warn).toHaveBeenCalledWith(
                expect.stringContaining('Overlapping sessions detected'),
            );
        });
    });
});
