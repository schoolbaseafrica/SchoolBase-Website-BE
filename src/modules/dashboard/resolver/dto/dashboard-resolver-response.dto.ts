import { ApiProperty } from '@nestjs/swagger';
import { ModuleDescriptor } from '../interface/module-descriptor-interface';
import { UserRole } from '../../../shared/enums';



export class StudentChildDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  first_name: string;

  @ApiProperty()
  last_name: string;

  @ApiProperty()
  class: string;
}

export class DashboardMetadataAdmin {
  @ApiProperty()
  total_students: number;

  @ApiProperty()
  total_teachers: number;

  @ApiProperty()
  total_parents: number;
}

export class DashboardMetadataTeacher {
  @ApiProperty({ required: false, nullable: true })
  timetable?: string | null;
}

export class DashboardMetadataStudent {
  @ApiProperty()
  class: string;

  @ApiProperty()
  enrollment_status: string;
}

export class DashboardMetadataParent {
  @ApiProperty({ type: [StudentChildDto] })
  children: StudentChildDto[];
}

export class DashboardResolvedDataDto {
  @ApiProperty({ enum: UserRole })
  dashboard: UserRole;

  @ApiProperty({ type: [Object] })
  modules: ModuleDescriptor[];

  @ApiProperty({ type: Object })
  metadata:
    | DashboardMetadataAdmin
    | DashboardMetadataTeacher
    | DashboardMetadataStudent
    | DashboardMetadataParent;
}

export class DashboardResolvedResponseDto {
  @ApiProperty({ example: 200 })
  status_code: number;

  @ApiProperty({ example: 'Dashboard resolved successfully' })
  message: string;

  @ApiProperty({ type: DashboardResolvedDataDto })
  data: DashboardResolvedDataDto;
}
