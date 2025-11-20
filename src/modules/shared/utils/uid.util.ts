import { nanoid } from 'nanoid';


export function generate_teacher_uid() {
return `tchr_${nanoid(12)}`;
}