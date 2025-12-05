import { ApiProperty } from '@nestjs/swagger';

import { SessionStatus } from '../../academic-session/entities';
import { ClassSubject, ClassTeacher } from '../../class/entities';
import { Schedule } from '../../timetable/entities/schedule.entity';
import { User } from '../../user/entities/user.entity';
import { Student } from '../entities';

import { StudentResponseDto } from './student-response.dto';

export class StudentAcademicDetailDto {
  @ApiProperty({
    description: 'The academic year, e.g., "2023/2024"',
    example: '2023/2024',
    nullable: true,
  })
  academic_year?: string;

  @ApiProperty({
    description: 'The name of the academic session',
    example: '2023/2024 Session',
  })
  name: string;

  @ApiProperty({ description: 'The start date of the session' })
  start_date: Date;

  @ApiProperty({ description: 'The end date of the session' })
  end_date: Date;

  @ApiProperty({
    description: 'A brief description of the session',
    nullable: true,
  })
  description?: string;

  @ApiProperty({
    description: 'The status of the session',
    enum: SessionStatus,
    example: SessionStatus.ACTIVE,
  })
  status: SessionStatus;
}

export class StudentSubjectDetailDto {
  @ApiProperty({
    description: "The teacher's details",
    type: ClassTeacher,
    isArray: true,
  })
  teachers: ClassTeacher[] | [];

  @ApiProperty({
    description: "The subject's detail",
    type: ClassSubject,
    isArray: true,
  })
  subjects: ClassSubject[] | [];
}

export class StudentTimetableDetailDto {
  @ApiProperty({
    description: 'The timetable schedule',
    type: Schedule,
    isArray: true,
  })
  schedules: Schedule[];
}

export class StudentClassDetailDto {
  @ApiProperty({
    description: 'The name of the class',
    example: 'Primary 1',
  })
  name: string;
}

export class StudentProfileResponseDto extends StudentResponseDto {
  @ApiProperty({
    description: 'The student academic details',
    type: StudentAcademicDetailDto,
    nullable: true,
  })
  academic_details?: StudentAcademicDetailDto;

  @ApiProperty({
    description: 'The student subject details',
    type: StudentSubjectDetailDto,
    nullable: true,
  })
  subject_details?: StudentSubjectDetailDto;

  @ApiProperty({
    description: 'The student timetable details',
    type: StudentTimetableDetailDto,
    nullable: true,
  })
  timetable_details?: StudentTimetableDetailDto;

  @ApiProperty({
    description: 'The student class details',
    type: StudentClassDetailDto,
    nullable: true,
  })
  class_name?: StudentClassDetailDto | null;

  constructor(student: Student, user: User, message?: string) {
    super(student, user, message);
    this.academic_details = student.stream
      ? {
          academic_year: student.stream.class.academicSession.academicYear,
          name: student.stream.class.academicSession.name,
          start_date: student.stream.class.academicSession.startDate,
          end_date: student.stream.class.academicSession.endDate,
          description: student.stream.class.academicSession.description,
          status: student.stream.class.academicSession.status,
        }
      : null;
    this.subject_details = student.stream
      ? {
          teachers: student.stream.class.teacher_assignment || [],
          subjects: student.stream.class.classSubjects || [],
        }
      : null;
    this.timetable_details = student.stream
      ? {
          schedules: student.stream.class.timetable?.schedules || [],
        }
      : null;
    this.class_name = student.stream
      ? {
          name: student.stream.class.name ?? '',
        }
      : null;
  }
}
