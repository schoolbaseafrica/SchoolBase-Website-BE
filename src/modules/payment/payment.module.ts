import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FeesModule } from '../fees/fees.module';
import { FileModule } from '../shared/file/file.module';
import { UploadModule } from '../upload/upload.module';

import { Payment } from './entities/payment.entity';
import { PaymentModelAction } from './model-action/payment.model-action';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentValidationService } from './services/payment-validation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment]),
    FeesModule,
    FileModule,
    UploadModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentModelAction, PaymentService, PaymentValidationService],
  exports: [PaymentModelAction, PaymentService],
})
export class PaymentModule {}
