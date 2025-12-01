import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from '../../../../entities/base-entity';
import { SuperAdmin } from '../../entities/superadmin.entity';

@Entity('superadmin_sessions')
export class SuperadminSession extends BaseEntity {
  @Column()
  superadmin_id!: string;

  @Column()
  expires_at!: Date;

  @Column({ type: 'text' })
  refresh_token!: string;

  @Column({ default: 'jwt' })
  provider!: string;

  @Column({ default: true })
  is_active!: boolean;

  @Column({ nullable: true })
  revoked_at?: Date;

  @ManyToOne(() => SuperAdmin, (superadmin) => superadmin.sessions)
  @JoinColumn({ name: 'superadmin_id' })
  superadmin!: SuperAdmin;
}
