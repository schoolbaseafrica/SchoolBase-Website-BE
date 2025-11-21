import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../shared/enums';

import {
  CreateTeacherDto,
  UpdateTeacherDto,
  TeacherResponseDto,
  GetTeachersQueryDto,
} from './dto';
import { GeneratePasswordResponseDto } from './dto/generate-password-response.dto';
import { TeacherService } from './teacher.service';

@Controller('teachers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Teachers')
@ApiBearerAuth()
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  // --- GET: GENERATE PASSWORD (PUBLIC ENDPOINT WITH RATE LIMITING) ---
  @Get('generate-password')
  @Public() // Mark as public endpoint (bypasses JWT auth)
  @UseGuards(RateLimitGuard) // Apply rate limiting
  @RateLimit({ maxRequests: 10, windowMs: 60000 }) // 10 requests per minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Generate a strong password for teacher creation (Public endpoint, rate limited)',
    description:
      'This is a public endpoint that generates secure passwords. Rate limited to 10 requests per minute per IP address.',
  })
  @ApiResponse({
    status: 200,
    description: 'Password generated successfully',
    type: GeneratePasswordResponseDto,
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Please try again later.',
  })
  async generatePassword(): Promise<GeneratePasswordResponseDto> {
    return this.teacherService.generatePassword();
  }

  // --- POST: CREATE TEACHER (ADMIN ONLY) ---
  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new teacher (ADMIN only)' })
  @ApiBody({ type: CreateTeacherDto })
  @ApiResponse({
    status: 201,
    description: 'Teacher created successfully',
    type: TeacherResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email or Employment ID already exists',
  })
  async create(
    @Body() createDto: CreateTeacherDto,
  ): Promise<TeacherResponseDto> {
    return this.teacherService.create(createDto);
  }

  // --- GET: LIST ALL TEACHERS (ADMIN/TEACHER READ) ---
  @Get()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Get all teachers with pagination, search, and active status filter',
  })
  @ApiResponse({
    status: 200,
    description: 'List of teachers retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/TeacherResponseDto' },
        },
        total: { type: 'number', example: 100 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 20 },
        total_pages: { type: 'number', example: 5 },
      },
    },
  })
  async findAll(@Query() query: GetTeachersQueryDto) {
    return this.teacherService.findAll(query);
  }

  // --- GET: GET TEACHER BY ID (ADMIN/TEACHER READ) ---
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get teacher by ID' })
  @ApiResponse({
    status: 200,
    description: 'Teacher retrieved successfully',
    type: TeacherResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TeacherResponseDto> {
    return this.teacherService.findOne(id);
  }

  // --- PATCH: UPDATE TEACHER (ADMIN ONLY) ---
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update teacher (partial, ADMIN only)' })
  @ApiBody({ type: UpdateTeacherDto })
  @ApiResponse({
    status: 200,
    description: 'Teacher updated successfully',
    type: TeacherResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  @ApiResponse({ status: 409, description: 'Employment ID cannot be updated' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateTeacherDto,
  ): Promise<TeacherResponseDto> {
    return this.teacherService.update(id, updateDto);
  }

  // --- DELETE: DEACTIVATE TEACHER (ADMIN ONLY) ---
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Deactivate teacher (Soft Delete/Set Inactive, ADMIN only)',
  })
  @ApiResponse({
    status: 204,
    description: 'Teacher deactivated successfully',
  })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.teacherService.remove(id);
  }
}
