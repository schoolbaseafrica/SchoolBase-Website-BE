import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ParentStudentLinkResponseDto {
    @ApiProperty({
        description: 'Parent ID (UUID)',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @Expose()
    parent_id: string;

    @ApiProperty({
        description: 'Array of successfully linked student IDs',
        example: [
            '123e4567-e89b-12d3-a456-426614174001',
            '123e4567-e89b-12d3-a456-426614174002',
        ],
        type: [String],
    })
    @Expose()
    linked_students: string[];

    @ApiProperty({
        description: 'Total number of students linked',
        example: 2,
    })
    @Expose()
    total_linked: number;
}
