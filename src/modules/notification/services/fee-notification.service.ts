import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

import * as sysMsg from '../../../constants/system.messages';
import { Class } from '../../class/entities';
import { Fees } from '../../fees/entities/fees.entity';
import { FeesModelAction } from '../../fees/model-action/fees.model-action';
import { FeeNotificationType } from '../../shared/enums';
import { Student } from '../../student/entities';
import { NotificationModelAction } from '../model-actions/notification.model-action';
import { NotificationType } from '../types/notification.types';

@Injectable()
export class FeeNotificationService {
  private readonly logger: Logger;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) baseLogger: Logger,
    private readonly notificationModelAction: NotificationModelAction,
    private readonly feesModelAction: FeesModelAction,
  ) {
    this.logger = baseLogger.child({ context: FeeNotificationService.name });
  }

  async createAndUpdateFeesNotification(
    feeId: string,
    type: FeeNotificationType,
  ): Promise<void> {
    // TO DO: switch to using query builder if performance becomes an issue
    const fee = await this.feesModelAction.get({
      identifierOptions: { id: feeId },
      relations: {
        direct_assignments: { student: { parent: true, user: true } },
        classes: {
          student_assignments: { student: { parent: true, user: true } },
        },
      },
    });
    if (!fee) {
      this.logger.error(sysMsg.FEE_NOT_FOUND, { feeId });
      return;
    }
    const students = this.getFeeStudents(fee);

    const studentsWithParents = students.filter(
      (student) => student.parent && student.parent.user_id,
    );

    if (studentsWithParents.length === 0) {
      this.logger.warn(
        'No parents found for students, skipping notifications',
        {
          fee_id: fee.id,
        },
      );
    }

    await this.notificationModelAction.createMany({
      createPayloads: studentsWithParents.map((student) => ({
        title: 'Fee Notification',
        message: `A fee ${fee.component_name} has been ${type} for your child ${student.user.first_name} ${student.user.last_name}.`,
        type: NotificationType.FEE_UPDATE,
        is_read: false,
        recipient_id: student.parent.user_id,
        metadata: {
          fee_id: fee.id,
          type: type,
          student_id: student.id,
          fee_name: fee.component_name,
          amount: fee.amount,
        },
      })),
      transactionOptions: { useTransaction: false },
    });
  }

  private getFeeStudents(fee: Fees): Student[] {
    const studentSet = new Set<Student>();

    fee.classes?.forEach((cls: Class) => {
      cls.student_assignments?.forEach((assignment) => {
        if (assignment?.student) studentSet.add(assignment.student);
      });
    });

    fee.direct_assignments?.forEach((assignment) => {
      if (assignment?.student) studentSet.add(assignment.student);
    });

    return Array.from(studentSet);
  }
}
