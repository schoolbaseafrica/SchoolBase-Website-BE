import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';
import { Stream } from '../../stream/entities/stream.entity';
import { User } from '../../user/entities/user.entity';

@Entity('students')
export class Student extends BaseEntity {
  @Column({ unique: true, name: 'registration_number' })
  registration_number: string;

  @Column({ name: 'photo_url', nullable: true })
  photo_url: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Stream, (stream) => stream.students)
  @JoinColumn({ name: 'stream_id' })
  stream: Stream;

  @Column({ type: 'boolean', default: false })
  is_deleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date | null;
}
