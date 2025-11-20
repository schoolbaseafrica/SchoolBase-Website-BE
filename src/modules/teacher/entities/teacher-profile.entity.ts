import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';


@Entity('teachers')
export class TeacherProfile {
@PrimaryGeneratedColumn()
id: number;


@Column({ unique: true })
teacher_uid: string;


@Column()
user_id: number;


@Column()
first_name: string;


@Column()
last_name: string;
}