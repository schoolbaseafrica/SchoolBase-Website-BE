import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';

import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '../../shared/enums';
import {
  ApiDepartmentTags,
  ApiDepartmentBearerAuth,
  ApiCreateDepartment,
} from '../docs/department.swagger';
import { CreateDepartmentDto } from '../dto/create-department.dto';
import { DepartmentService } from '../services/department.service';

@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiDepartmentTags()
@ApiDepartmentBearerAuth()
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateDepartment()
  create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentService.create(createDepartmentDto);
  }
}
