export enum TeacherDailyAttendanceStatusEnum {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EXCUSED = 'EXCUSED',
  HALF_DAY = 'HALF_DAY',
}

export enum TeacherDailyAttendanceSourceEnum {
  MANUAL = 'MANUAL',
  AUTOMATED = 'NFC',
}

export enum TeacherDailyAttendanceDecisionEnum {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}
