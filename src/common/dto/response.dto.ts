import { ApiProperty } from '@nestjs/swagger';

// This is a base App Response DTO can be updated later when we finalize the app responses, I just needed it to finish my work
export class ApiResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;
}

export class ApiSuccessResponseDto<T = undefined> extends ApiResponseDto {
  @ApiProperty({ required: false, type: Object })
  data?: T;

  @ApiProperty()
  message: string;

  constructor(message: string, data?: T) {
    super();
    this.success = true;
    if (data !== undefined) this.data = data;
    this.message = message;
  }
}

export class ApiErrorResponseDto extends ApiResponseDto {
  @ApiProperty({ required: false })
  error?: string;

  constructor(error: string, message = 'failed') {
    super();
    this.success = false;
    this.error = error;
    this.message = message;
  }
}
