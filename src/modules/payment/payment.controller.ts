import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

import * as sysMsg from '../../constants/system.messages';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../shared/enums';

import { recordPaymentDoc } from './docs/payment.doc';
import { PaymentResponseDto, RecordPaymentDto } from './dto/payment.dto';
import { PaymentService } from './payment.service';

@ApiTags('Fee Payments')
@Controller('fee-payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeePaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly fileService: File,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @recordPaymentDoc()
  @UseInterceptors(
    FileInterceptor('receipt_file', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|pdf)$/)) {
          return cb(
            new BadRequestException('Only JPG, PNG, and PDF files are allowed'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async recordPayment(
    @Body() dto: RecordPaymentDto,
    @CurrentUser('id') userId: string,
    @UploadedFile() receiptFile?: Express.Multer.File,
  ) {
    let receipt_url: string | undefined;

    if (receiptFile) {
      // TODO: Implement file upload condition
      // const uploaded_url = await this.uploadService.upload(receipt_file);
      // receipt_url = this.fileService.validatePhotoUrl(uploaded_url);
    }

    const payment = await this.paymentService.recordPayment(
      dto,
      userId,
      receipt_url,
    );

    const response = plainToInstance(PaymentResponseDto, payment, {
      excludeExtraneousValues: true,
    });

    return {
      message: sysMsg.PAYMENT_SUCCESS,
      response,
    };
  }
}
