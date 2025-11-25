import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { CreateParentDto } from './create-parent.dto';

export class UpdateParentDto extends PartialType(CreateParentDto) {
  @ApiPropertyOptional({
    description: 'Email cannot be updated after creation',
    readOnly: true,
  })
  email?: string;
}
