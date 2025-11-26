import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  ParseUUIDPipe,
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
  ApiUpdateDepartment,
  ApiRemoveDepartment,
} from '../docs/department.swagger';
import { CreateDepartmentDto } from '../dto/create-department.dto';
import { UpdateDepartmentDto } from '../dto/update-department.dto';
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

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiUpdateDepartment()
  update(
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    return this.departmentService.update(id, updateDepartmentDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiRemoveDepartment()
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.departmentService.remove(id);
  }
}
