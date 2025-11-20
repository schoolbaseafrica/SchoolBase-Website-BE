import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit.entity';


@Injectable()
export class AuditService {
private readonly logger = new Logger(AuditService.name);


constructor(
@InjectRepository(AuditLog)
private readonly auditRepo: Repository<AuditLog>,
) {}


/**
* Log an action to the audit_logs table.
* @param actorUserId - id of the admin/user who performed the action (nullable)
* @param action - human readable action string
* @param metadata - optional structured metadata (object)
*/
async logAction(actorUserId: string | null, action: string, metadata?: any) {
try {
const entry = this.auditRepo.create({ actorUserId, action, metadata });
await this.auditRepo.save(entry);
} catch (err) {
// do not throw — audit failure should not block primary flow, but log
this.logger.error('Failed to write audit log', err?.stack || err);
}
}


/**
* Retrieve audit logs with optional pagination and filtering.
*/
async list({ limit = 50, offset = 0, actorUserId, action }: { limit?: number; offset?: number; actorUserId?: string; action?: string; } = {}) {
const qb = this.auditRepo.createQueryBuilder('a').orderBy('a.created_at', 'DESC').take(limit).skip(offset);
if (actorUserId) qb.andWhere('a.actor_user_id = :actorUserId', { actorUserId });
if (action) qb.andWhere('a.action ILIKE :action', { action: `%${action}%` });
return qb.getMany();
}
}