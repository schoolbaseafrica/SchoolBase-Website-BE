import { Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';
import { Stream } from '../../stream/entities/stream.entity';
import { User } from '../../user/entities/user.entity';

@Entity('students')
export class Student extends BaseEntity {
  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Stream, (stream) => stream.students)
  @JoinColumn({ name: 'stream_id' })
  stream: Stream;
}
