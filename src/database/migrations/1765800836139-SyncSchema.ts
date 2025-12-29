import { MigrationInterface, QueryRunner } from 'typeorm';

export class SyncSchema1765800836139 implements MigrationInterface {
  name = 'SyncSchema1765800836139';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP CONSTRAINT IF EXISTS "FK_sessions_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_2fa" DROP CONSTRAINT IF EXISTS "FK_ed539980faac14226a05368c4d1"`,
    );
    await queryRunner.query(`
        DO $$ BEGIN
            CREATE TYPE "public"."terms_name_enum" AS ENUM('First term', 'Second term', 'Third term');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
        `);
    await queryRunner.query(`
        DO $$ BEGIN
            CREATE TYPE "public"."terms_status_enum" AS ENUM('Active', 'Inactive');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
        `);
    await queryRunner.query(
      `CREATE TABLE "terms" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "session_id" uuid NOT NULL, "name" "public"."terms_name_enum" NOT NULL, "start_date" date NOT NULL, "end_date" date NOT NULL, "status" "public"."terms_status_enum" NOT NULL DEFAULT 'Active', "is_current" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_33b6fe77d6ace7ff43cc8a65958" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "rooms" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(255) NOT NULL, "type" character varying(255) NOT NULL, "capacity" integer NOT NULL, "location" character varying(255) NOT NULL, CONSTRAINT "UQ_48b79438f8707f3d9ca83d85ea0" UNIQUE ("name"), CONSTRAINT "PK_0368a2d7c215f2d0458a54933f2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "class_teachers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "session_id" character varying NOT NULL, "assignment_date" TIMESTAMP NOT NULL DEFAULT now(), "is_active" boolean NOT NULL DEFAULT true, "class_id" uuid, "teacher_id" uuid, CONSTRAINT "PK_af6f6d3e46a2ac73959f65f3d9a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "parents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "photo_url" character varying, "is_active" boolean NOT NULL DEFAULT true, "deleted_at" TIMESTAMP, CONSTRAINT "UQ_c94c3cea9b43a18c81269ded41d" UNIQUE ("user_id"), CONSTRAINT "REL_c94c3cea9b43a18c81269ded41" UNIQUE ("user_id"), CONSTRAINT "PK_9a4dc67c7b8e6a9cb918938d353" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "students" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "registration_number" character varying NOT NULL, "photo_url" character varying, "current_class_id" uuid, "is_deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "user_id" uuid, "stream_id" uuid, "parent_id" uuid, CONSTRAINT "UQ_82946fdb5652b83cacb81e9083e" UNIQUE ("registration_number"), CONSTRAINT "REL_fb3eff90b11bddf7285f9b4e28" UNIQUE ("user_id"), CONSTRAINT "PK_7d7f07271ad4ce999880713f05e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_77329d8dd9e1d16f58ad7ad0b3" ON "students" ("current_class_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "class_students" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "session_id" character varying NOT NULL, "enrollment_date" TIMESTAMP NOT NULL DEFAULT now(), "is_active" boolean NOT NULL DEFAULT true, "class_id" uuid, "student_id" uuid, CONSTRAINT "PK_f1ef7a4fd2eabf7ef3c6bc7cae3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."teachers_title_enum" AS ENUM('Mr', 'Mrs', 'Miss', 'Dr', 'Prof')`,
    );
    await queryRunner.query(
      `CREATE TABLE "teachers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "employment_id" character varying NOT NULL, "title" "public"."teachers_title_enum" NOT NULL, "photo_url" character varying, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_4668d4752e6766682d1be0b346f" UNIQUE ("user_id"), CONSTRAINT "UQ_8e683bfa0a4320b135683e5e054" UNIQUE ("employment_id"), CONSTRAINT "REL_4668d4752e6766682d1be0b346" UNIQUE ("user_id"), CONSTRAINT "PK_a8d4f83be3abe4c687b0a0093c8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "class_subjects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "teacher_assignment_date" TIMESTAMP, "class_id" uuid NOT NULL, "subject_id" uuid NOT NULL, "teacher_id" uuid, CONSTRAINT "UQ_bd863400a0b317b7e43118a970b" UNIQUE ("class_id", "subject_id"), CONSTRAINT "PK_4e1ecabd8771166a29291dc09ed" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "subjects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(255) NOT NULL, CONSTRAINT "UQ_47a287fe64bd0e1027e603c335c" UNIQUE ("name"), CONSTRAINT "UQ_47a287fe64bd0e1027e603c335c" UNIQUE ("name"), CONSTRAINT "PK_1a023685ac2b051b4e557b0b280" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."schedules_day_enum" AS ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."schedules_period_type_enum" AS ENUM('ACADEMICS', 'BREAK')`,
    );
    await queryRunner.query(
      `CREATE TABLE "schedules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "day" "public"."schedules_day_enum" NOT NULL, "start_time" TIME NOT NULL, "end_time" TIME NOT NULL, "period_type" "public"."schedules_period_type_enum" NOT NULL DEFAULT 'ACADEMICS', "room_id" uuid, "timetable_id" uuid NOT NULL, "subject_id" uuid, "teacher_id" uuid, CONSTRAINT "PK_7e33fc2ea755a5765e3564e66dd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "timetables" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "class_id" uuid NOT NULL, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "REL_54d3ddcc757a7639a1ca4ea159" UNIQUE ("class_id"), CONSTRAINT "PK_9dd7e50645bff59e9ac5b4725c0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "class" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying NOT NULL, "stream" character varying, "arm" character varying, "is_deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "academic_session_id" uuid NOT NULL, CONSTRAINT "UQ_8bd096a7175df0d7ad14e805b46" UNIQUE ("name", "arm", "academic_session_id"), CONSTRAINT "PK_0b9024d21bdfba8b1bd1c300eae" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "stream" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(100) NOT NULL, "class_id" uuid NOT NULL, CONSTRAINT "UQ_88a6010af8d39ff0573a2e2d297" UNIQUE ("class_id", "name"), CONSTRAINT "PK_0dc9d7e04ff213c08a096f835f2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_670f7496ebbd8029b00e80841e" ON "stream" ("class_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "teacher_subjects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "teacher_id" uuid NOT NULL, "subject_id" uuid NOT NULL, "class_id" character varying, "is_active" boolean NOT NULL DEFAULT true, "notes" text, CONSTRAINT "UQ_9e05964fe6f2598b643470c2067" UNIQUE ("teacher_id", "subject_id"), CONSTRAINT "PK_9f5ee8b3beb5c7c1ea50a8d7908" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "teacher_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "teacher_uid" character varying NOT NULL, "user_id" integer NOT NULL, "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, CONSTRAINT "UQ_663fbeaaa7b4db3242cbda8767c" UNIQUE ("teacher_uid"), CONSTRAINT "PK_fdd17d62015e40674217a407484" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."superadmin_role_enum" AS ENUM('SUPERADMIN')`,
    );
    await queryRunner.query(
      `CREATE TABLE "superadmin" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "first_name" character varying(50) NOT NULL, "last_name" character varying(50) NOT NULL, "email" character varying NOT NULL, "school_name" character varying(255) NOT NULL, "password" character varying, "is_active" boolean NOT NULL DEFAULT false, "reset_token" character varying, "reset_token_expiration" date, "role" "public"."superadmin_role_enum" NOT NULL DEFAULT 'SUPERADMIN', CONSTRAINT "UQ_00b221dab05a330bb5f6c4b3d6b" UNIQUE ("email"), CONSTRAINT "PK_34da9117b572e9b32a8d829ae84" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "superadmin_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "superadmin_id" uuid NOT NULL, "expires_at" TIMESTAMP NOT NULL, "refresh_token" text NOT NULL, "provider" character varying NOT NULL DEFAULT 'jwt', "is_active" boolean NOT NULL DEFAULT true, "revoked_at" TIMESTAMP, CONSTRAINT "PK_1364d3735b0efcbb44b56d0c347" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "session" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "expiresAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f55da76ac1c3ac420f444d2ff11" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "schools" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(150) NOT NULL, "address" character varying(255), "logo_url" character varying, "email" character varying, "phone" character varying(20), "primary_color" character varying, "secondary_color" character varying, "accent_color" character varying, "installation_completed" boolean NOT NULL DEFAULT false, "database_url" text, CONSTRAINT "UQ_74a5374cf6d1c970dd47f888bf6" UNIQUE ("email"), CONSTRAINT "PK_95b932e47ac129dd8e23a0db548" PRIMARY KEY ("id")); COMMENT ON COLUMN "schools"."database_url" IS 'Dedicated DB connection'`,
    );
    await queryRunner.query(
      `CREATE TABLE "result_subject_lines" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "result_id" uuid NOT NULL, "subject_id" uuid NOT NULL, "ca_score" numeric(5,2), "exam_score" numeric(5,2), "total_score" numeric(5,2), "grade_letter" character varying(2), "remark" text, CONSTRAINT "PK_e61cbdf14035df7bc1da89aefe8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "results" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "student_id" uuid NOT NULL, "class_id" uuid NOT NULL, "term_id" uuid NOT NULL, "academic_session_id" uuid NOT NULL, "total_score" numeric(8,2), "average_score" numeric(5,2), "grade_letter" character varying(2), "position" integer, "remark" text, "subject_count" integer NOT NULL DEFAULT '0', "generated_at" TIMESTAMP, CONSTRAINT "UQ_d02acaf6de1d96fa51fd8711281" UNIQUE ("student_id", "class_id", "term_id", "academic_session_id"), CONSTRAINT "PK_e8f2a9191c61c15b627c117a678" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "fee_assignments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fee_id" uuid NOT NULL, "student_id" uuid NOT NULL, CONSTRAINT "PK_5d52331b84e42c325461e73d798" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."fees_status_enum" AS ENUM('ACTIVE', 'INACTIVE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "fees" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "component_name" character varying NOT NULL, "description" character varying, "amount" numeric(12,2) NOT NULL, "term_id" uuid NOT NULL, "status" "public"."fees_status_enum" NOT NULL DEFAULT 'ACTIVE', "created_by" uuid, CONSTRAINT "PK_97f3a1b1b8ee5674fd4da93f461" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_payment_method_enum" AS ENUM('cash', 'bank_transfer', 'card', 'mobile_money', 'cheque')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_status_enum" AS ENUM('paid', 'pending', 'overdue')`,
    );
    await queryRunner.query(
      `CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "student_id" uuid NOT NULL, "fee_component_id" uuid NOT NULL, "amount_paid" numeric(12,2) NOT NULL, "payment_method" "public"."payments_payment_method_enum" NOT NULL, "payment_date" TIMESTAMP NOT NULL, "term_id" uuid NOT NULL, "session_id" uuid NOT NULL, "invoice_number" character varying, "transaction_id" character varying, "receipt_url" character varying, "status" "public"."payments_status_enum" NOT NULL DEFAULT 'paid', "recorded_by" uuid NOT NULL, CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_type_enum" AS ENUM('ACADEMIC_UPDATE', 'RESULT_ALERT', 'TIMETABLE_CHANGE', 'FEE_UPDATE', 'SYSTEM_ALERT')`,
    );
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "recipient_id" character varying NOT NULL, "title" character varying NOT NULL, "message" text NOT NULL, "type" "public"."notifications_type_enum" NOT NULL DEFAULT 'SYSTEM_ALERT', "is_read" boolean NOT NULL DEFAULT false, "metadata" jsonb, CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5332a4daa46fd3f4e6625dd275" ON "notifications" ("recipient_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "notification_preference" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "preferences" jsonb, CONSTRAINT "REL_ff040d2d2e35c49b0052578382" UNIQUE ("user_id"), CONSTRAINT "PK_ba8d816b10f3dcfcd2e71ce5776" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ff040d2d2e35c49b0052578382" ON "notification_preference" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."invites_status_enum" AS ENUM('pending', 'used', 'expired', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "invites" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "email" character varying NOT NULL, "accepted" boolean NOT NULL DEFAULT false, "invited_at" TIMESTAMP NOT NULL DEFAULT now(), "expires_at" TIMESTAMP, "role" character varying NOT NULL, "full_name" character varying, "status" "public"."invites_status_enum" NOT NULL DEFAULT 'pending', "token_hash" character varying, "school_id" uuid, CONSTRAINT "UQ_08583b1882195ae2674f8391323" UNIQUE ("email"), CONSTRAINT "PK_aa52e96b44a714372f4dd31a0af" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0843131f4ae91435709527a4f1" ON "invites" ("token_hash") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."grade_submissions_status_enum" AS ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "grade_submissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "teacher_id" uuid NOT NULL, "class_id" uuid NOT NULL, "subject_id" uuid NOT NULL, "term_id" uuid NOT NULL, "academic_session_id" uuid NOT NULL, "status" "public"."grade_submissions_status_enum" NOT NULL DEFAULT 'DRAFT', "submitted_at" TIMESTAMP, "reviewed_at" TIMESTAMP, "reviewed_by" uuid, "rejection_reason" text, CONSTRAINT "PK_d360d3e8498f69fbde61d3d1bba" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "grades" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "submission_id" uuid NOT NULL, "student_id" uuid NOT NULL, "ca_score" numeric(5,2), "exam_score" numeric(5,2), "total_score" numeric(5,2), "grade_letter" character varying(2), "comment" text, CONSTRAINT "PK_4740fb6f5df2505a48649f1687b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "databases" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "school_email" character varying NOT NULL, "database_name" character varying NOT NULL, "database_host" character varying NOT NULL, "database_username" character varying NOT NULL, "database_port" integer NOT NULL, "database_password" character varying NOT NULL, "email" character varying, CONSTRAINT "UQ_7b3b2d04bd716b0ad45d627756f" UNIQUE ("school_email"), CONSTRAINT "REL_c79845ecc69427038b52d0d967" UNIQUE ("email"), CONSTRAINT "PK_238a190c9ace4bea3dc1896f988" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."teacher_manual_checkins_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "teacher_manual_checkins" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "teacher_id" uuid NOT NULL, "check_in_date" date NOT NULL, "check_in_time" TIMESTAMP NOT NULL, "submitted_at" TIMESTAMP NOT NULL, "reason" text NOT NULL, "status" "public"."teacher_manual_checkins_status_enum" NOT NULL DEFAULT 'PENDING', "reviewed_by" uuid, "reviewed_at" TIMESTAMP, "review_notes" text, CONSTRAINT "PK_5f6016e1e855a19a9d535dbffba" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_85cae8a0b9946afe6afec4b095" ON "teacher_manual_checkins" ("teacher_id", "check_in_date") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."teacher_daily_attendance_status_enum" AS ENUM('PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'HALF_DAY')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."teacher_daily_attendance_source_enum" AS ENUM('MANUAL', 'AUTOMATED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "teacher_daily_attendance" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "teacher_id" uuid NOT NULL, "date" date NOT NULL, "check_in_time" TIMESTAMP NOT NULL, "status" "public"."teacher_daily_attendance_status_enum" NOT NULL DEFAULT 'ABSENT', "source" "public"."teacher_daily_attendance_source_enum" NOT NULL DEFAULT 'MANUAL', "marked_by" uuid NOT NULL, "marked_at" TIMESTAMP NOT NULL, "notes" text, "check_out_time" TIMESTAMP, "total_hours" numeric(5,2), CONSTRAINT "PK_bfa80db64f84dd4f4128bad2b63" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ba382c591eca4c1ce45fb6a086" ON "teacher_daily_attendance" ("date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e9813fac28685a38416f693067" ON "teacher_daily_attendance" ("teacher_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_5750aae3f46e412d7b2c3ea541" ON "teacher_daily_attendance" ("teacher_id", "date") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."student_daily_attendance_status_enum" AS ENUM('PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'HALF_DAY')`,
    );
    await queryRunner.query(
      `CREATE TABLE "student_daily_attendance" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "student_id" uuid NOT NULL, "session_id" uuid NOT NULL, "date" date NOT NULL, "marked_by" uuid NOT NULL, "marked_at" TIMESTAMP NOT NULL DEFAULT now(), "notes" text, "is_locked" boolean NOT NULL DEFAULT false, "class_id" uuid NOT NULL, "status" "public"."student_daily_attendance_status_enum" NOT NULL DEFAULT 'ABSENT', "check_in_time" TIMESTAMP, "check_out_time" TIMESTAMP, CONSTRAINT "PK_15a1889d4e57ea499b17f2f86a9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e959ecd14c0930e92ee458f4e1" ON "student_daily_attendance" ("session_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_012380a3d50ecf3c163570360f" ON "student_daily_attendance" ("date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a2f3d140138e4b0ae2ad79a294" ON "student_daily_attendance" ("student_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0d76bd8d24058e1f0cb521311f" ON "student_daily_attendance" ("class_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_b9dfbb7268b46ca0adf953a39d" ON "student_daily_attendance" ("student_id", "class_id", "date") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."attendance_edit_requests_attendance_type_enum" AS ENUM('SCHEDULE_BASED', 'DAILY')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."attendance_edit_requests_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "attendance_edit_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "attendance_id" uuid NOT NULL, "attendance_type" "public"."attendance_edit_requests_attendance_type_enum" NOT NULL, "requested_by" uuid NOT NULL, "proposed_changes" jsonb NOT NULL, "reason" text NOT NULL, "status" "public"."attendance_edit_requests_status_enum" NOT NULL DEFAULT 'PENDING', "reviewed_by" uuid, "reviewed_at" TIMESTAMP, "admin_comment" text, CONSTRAINT "PK_9a09445ca0addca00697461b783" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b03a45aa2f09370e95f64099b0" ON "attendance_edit_requests" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5ec84a04f80d8b880ba243f217" ON "attendance_edit_requests" ("requested_by") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7f7da705790cfe99d0e2cad8f9" ON "attendance_edit_requests" ("attendance_id", "attendance_type") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."attendance_records_status_enum" AS ENUM('PRESENT', 'ABSENT', 'LATE', 'EXCUSED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "attendance_records" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "student_id" uuid NOT NULL, "session_id" uuid NOT NULL, "date" date NOT NULL, "marked_by" uuid NOT NULL, "marked_at" TIMESTAMP NOT NULL DEFAULT now(), "notes" text, "is_locked" boolean NOT NULL DEFAULT false, "schedule_id" uuid NOT NULL, "status" "public"."attendance_records_status_enum" NOT NULL DEFAULT 'ABSENT', CONSTRAINT "PK_946920332f5bc9efad3f3023b96" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c51be2c1149e22de76b17626cb" ON "attendance_records" ("session_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9fb6ef15f899489af7e47b6c83" ON "attendance_records" ("date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dbace05c012526710663f8d891" ON "attendance_records" ("student_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0dfe6d219c4a7a162ca0f84243" ON "attendance_records" ("schedule_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_bc5a681d5155da257b53212208" ON "attendance_records" ("student_id", "schedule_id", "date") `,
    );
    await queryRunner.query(
      `CREATE TABLE "fee_classes" ("fee_id" uuid NOT NULL, "class_id" uuid NOT NULL, CONSTRAINT "PK_0fc2686531814abf35bdaafe63f" PRIMARY KEY ("fee_id", "class_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a606fe84b86235ee3a1c5dcd06" ON "fee_classes" ("fee_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6b4d2abab1dd082a5356bb6058" ON "fee_classes" ("class_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_sessions" ADD "academic_year" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_sessions" ADD CONSTRAINT "UQ_b4b2fcff2d0dc08528c6eaa427d" UNIQUE ("academic_year")`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_sessions" ADD "description" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_sessions" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "google_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_0bd5012aeb82628e07f6a1be53b" UNIQUE ("google_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "home_address" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "is_verified" boolean DEFAULT true`,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "deleted_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "users" ADD "streamId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "sessions" ALTER COLUMN "provider" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ALTER COLUMN "is_active" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_sessions" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_sessions" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_sessions" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_sessions" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_sessions" DROP CONSTRAINT "UQ_5557c033f7a596c8ea80f741841"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."academic_sessions_status_enum" RENAME TO "academic_sessions_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."academic_sessions_status_enum" AS ENUM('Active', 'Inactive', 'Archived')`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_sessions" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_sessions" ALTER COLUMN "status" TYPE "public"."academic_sessions_status_enum" USING "status"::"text"::"public"."academic_sessions_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_sessions" ALTER COLUMN "status" SET DEFAULT 'Active'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."academic_sessions_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "FK_085d540d9f418cfbdc7bd55bb19" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "terms" ADD CONSTRAINT "FK_2a45e5f1a157f965dad749ef1dd" FOREIGN KEY ("session_id") REFERENCES "academic_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "class_teachers" ADD CONSTRAINT "FK_1192d6f4432d1de68d66e9a9cd7" FOREIGN KEY ("class_id") REFERENCES "class"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "class_teachers" ADD CONSTRAINT "FK_504b6c1a3616565a5a1cedcaa63" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "parents" ADD CONSTRAINT "FK_c94c3cea9b43a18c81269ded41d" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD CONSTRAINT "FK_fb3eff90b11bddf7285f9b4e281" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD CONSTRAINT "FK_277791be7d963aa0529c476f7d2" FOREIGN KEY ("stream_id") REFERENCES "stream"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD CONSTRAINT "FK_77329d8dd9e1d16f58ad7ad0b3a" FOREIGN KEY ("current_class_id") REFERENCES "class"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD CONSTRAINT "FK_209313beb8d3f51f7ad69214d90" FOREIGN KEY ("parent_id") REFERENCES "parents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "class_students" ADD CONSTRAINT "FK_43e081daadb906f3dc41bb267dd" FOREIGN KEY ("class_id") REFERENCES "class"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "class_students" ADD CONSTRAINT "FK_6d12f65ab61f9f92e3d7e95ad23" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "teachers" ADD CONSTRAINT "FK_4668d4752e6766682d1be0b346f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "class_subjects" ADD CONSTRAINT "FK_433f93dd22b685e59c285726a1f" FOREIGN KEY ("class_id") REFERENCES "class"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "class_subjects" ADD CONSTRAINT "FK_9d8971acdcc64a1703357a00759" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "class_subjects" ADD CONSTRAINT "FK_f1406cab45041349673d6887aed" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedules" ADD CONSTRAINT "FK_2b9a68c93adbc74afa109bb2a73" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedules" ADD CONSTRAINT "FK_2177ec4fc6490209c0b9dcbf206" FOREIGN KEY ("timetable_id") REFERENCES "timetables"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedules" ADD CONSTRAINT "FK_ea337fc21e4c484e86392809d79" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedules" ADD CONSTRAINT "FK_2c027020a88187efddd0dbb8421" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "timetables" ADD CONSTRAINT "FK_54d3ddcc757a7639a1ca4ea159c" FOREIGN KEY ("class_id") REFERENCES "class"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "class" ADD CONSTRAINT "FK_c07874fd7fa46efbb14dad30005" FOREIGN KEY ("academic_session_id") REFERENCES "academic_sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "stream" ADD CONSTRAINT "FK_670f7496ebbd8029b00e80841e7" FOREIGN KEY ("class_id") REFERENCES "class"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_969b3e450b298cc8c6be9028caf" FOREIGN KEY ("streamId") REFERENCES "stream"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher_subjects" ADD CONSTRAINT "FK_6675136306b9111126bbdbbaba7" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher_subjects" ADD CONSTRAINT "FK_f35ef96bfb3a84b712722d6db70" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "superadmin_sessions" ADD CONSTRAINT "FK_926db05e96145ee08e015f65af7" FOREIGN KEY ("superadmin_id") REFERENCES "superadmin"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "session" ADD CONSTRAINT "FK_3d2f174ef04fb312fdebd0ddc53" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "result_subject_lines" ADD CONSTRAINT "FK_cfa18ea8b7b83237bdaffa2618f" FOREIGN KEY ("result_id") REFERENCES "results"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "result_subject_lines" ADD CONSTRAINT "FK_e400231f18da1b391ad34fb8c3b" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "results" ADD CONSTRAINT "FK_7c5bf104ec5fbc6d177be01af8e" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "results" ADD CONSTRAINT "FK_11e826f5bdc34d0c7c785ec4657" FOREIGN KEY ("class_id") REFERENCES "class"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "results" ADD CONSTRAINT "FK_1213ca228b65860aaaa9e6fb28c" FOREIGN KEY ("term_id") REFERENCES "terms"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "results" ADD CONSTRAINT "FK_46e376bbab6f5073210fe39ba5d" FOREIGN KEY ("academic_session_id") REFERENCES "academic_sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee_assignments" ADD CONSTRAINT "FK_043dd779984ebc0332304d6704d" FOREIGN KEY ("fee_id") REFERENCES "fees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee_assignments" ADD CONSTRAINT "FK_be103abff56397d4cccb3a79db3" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fees" ADD CONSTRAINT "FK_8e42cd61870ee8c71072eff55a3" FOREIGN KEY ("term_id") REFERENCES "terms"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fees" ADD CONSTRAINT "FK_6b69f3bd75527a53189b1c08a5f" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_9fd5d6ef620b0140a67ff2d95c4" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_0059ed90877cc0444e487e7670d" FOREIGN KEY ("fee_component_id") REFERENCES "fees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_f63c15a47ca5b8f3c2c7564a6be" FOREIGN KEY ("term_id") REFERENCES "terms"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_b8128ab843771cf6d42ab3ca188" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_preference" ADD CONSTRAINT "FK_ff040d2d2e35c49b00525783829" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invites" ADD CONSTRAINT "FK_7f2f179b9f5940e0f8f41847cfa" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "grade_submissions" ADD CONSTRAINT "FK_37cbaeea015876dfed7c75a58b7" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "grade_submissions" ADD CONSTRAINT "FK_3c67b4d55513ccb754799317a94" FOREIGN KEY ("class_id") REFERENCES "class"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "grade_submissions" ADD CONSTRAINT "FK_6184a506f8e6066a44c25b028c7" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "grade_submissions" ADD CONSTRAINT "FK_d67751032d6f2ffa297234e3566" FOREIGN KEY ("term_id") REFERENCES "terms"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "grade_submissions" ADD CONSTRAINT "FK_468e5c8fa2defd4f3af00976e8c" FOREIGN KEY ("academic_session_id") REFERENCES "academic_sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "grade_submissions" ADD CONSTRAINT "FK_503b8800bf521baf496516c4d4d" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "grades" ADD CONSTRAINT "FK_f573ccb37f87e9ef83c31308bce" FOREIGN KEY ("submission_id") REFERENCES "grade_submissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "grades" ADD CONSTRAINT "FK_9acca493883cee3b9e8f9e01cd1" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "databases" ADD CONSTRAINT "FK_c79845ecc69427038b52d0d9672" FOREIGN KEY ("email") REFERENCES "schools"("email") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_2fa" ADD CONSTRAINT "FK_ed539980faac14226a05368c4d1" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher_manual_checkins" ADD CONSTRAINT "FK_eebea58c9f82106ae89a059a183" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher_manual_checkins" ADD CONSTRAINT "FK_2850e375fae7c171e43939f9025" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher_daily_attendance" ADD CONSTRAINT "FK_e9813fac28685a38416f693067d" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher_daily_attendance" ADD CONSTRAINT "FK_1f6c2d71ef0620300c1bb616a94" FOREIGN KEY ("marked_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_daily_attendance" ADD CONSTRAINT "FK_a2f3d140138e4b0ae2ad79a2949" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_daily_attendance" ADD CONSTRAINT "FK_ad357d3f27de39e5494aadcbaff" FOREIGN KEY ("marked_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_daily_attendance" ADD CONSTRAINT "FK_0d76bd8d24058e1f0cb521311f3" FOREIGN KEY ("class_id") REFERENCES "class"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance_edit_requests" ADD CONSTRAINT "FK_5ec84a04f80d8b880ba243f217f" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance_edit_requests" ADD CONSTRAINT "FK_25c041560d101752a1415a5b09d" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance_records" ADD CONSTRAINT "FK_dbace05c012526710663f8d8911" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance_records" ADD CONSTRAINT "FK_48234156b97562091d6f90f40f9" FOREIGN KEY ("marked_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance_records" ADD CONSTRAINT "FK_0dfe6d219c4a7a162ca0f84243c" FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee_classes" ADD CONSTRAINT "FK_a606fe84b86235ee3a1c5dcd06e" FOREIGN KEY ("fee_id") REFERENCES "fees"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee_classes" ADD CONSTRAINT "FK_6b4d2abab1dd082a5356bb6058a" FOREIGN KEY ("class_id") REFERENCES "class"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "fee_classes" DROP CONSTRAINT "FK_6b4d2abab1dd082a5356bb6058a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee_classes" DROP CONSTRAINT "FK_a606fe84b86235ee3a1c5dcd06e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance_records" DROP CONSTRAINT "FK_0dfe6d219c4a7a162ca0f84243c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance_records" DROP CONSTRAINT "FK_48234156b97562091d6f90f40f9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance_records" DROP CONSTRAINT "FK_dbace05c012526710663f8d8911"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance_edit_requests" DROP CONSTRAINT "FK_25c041560d101752a1415a5b09d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance_edit_requests" DROP CONSTRAINT "FK_5ec84a04f80d8b880ba243f217f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_daily_attendance" DROP CONSTRAINT "FK_0d76bd8d24058e1f0cb521311f3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_daily_attendance" DROP CONSTRAINT "FK_ad357d3f27de39e5494aadcbaff"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_daily_attendance" DROP CONSTRAINT "FK_a2f3d140138e4b0ae2ad79a2949"`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher_daily_attendance" DROP CONSTRAINT "FK_1f6c2d71ef0620300c1bb616a94"`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher_daily_attendance" DROP CONSTRAINT "FK_e9813fac28685a38416f693067d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher_manual_checkins" DROP CONSTRAINT "FK_2850e375fae7c171e43939f9025"`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher_manual_checkins" DROP CONSTRAINT "FK_eebea58c9f82106ae89a059a183"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_2fa" DROP CONSTRAINT "FK_ed539980faac14226a05368c4d1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "databases" DROP CONSTRAINT "FK_c79845ecc69427038b52d0d9672"`,
    );
    await queryRunner.query(
      `ALTER TABLE "grades" DROP CONSTRAINT "FK_9acca493883cee3b9e8f9e01cd1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "grades" DROP CONSTRAINT "FK_f573ccb37f87e9ef83c31308bce"`,
    );
    await queryRunner.query(
      `ALTER TABLE "grade_submissions" DROP CONSTRAINT "FK_503b8800bf521baf496516c4d4d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "grade_submissions" DROP CONSTRAINT "FK_468e5c8fa2defd4f3af00976e8c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "grade_submissions" DROP CONSTRAINT "FK_d67751032d6f2ffa297234e3566"`,
    );
    await queryRunner.query(
      `ALTER TABLE "grade_submissions" DROP CONSTRAINT "FK_6184a506f8e6066a44c25b028c7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "grade_submissions" DROP CONSTRAINT "FK_3c67b4d55513ccb754799317a94"`,
    );
    await queryRunner.query(
      `ALTER TABLE "grade_submissions" DROP CONSTRAINT "FK_37cbaeea015876dfed7c75a58b7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invites" DROP CONSTRAINT "FK_7f2f179b9f5940e0f8f41847cfa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_preference" DROP CONSTRAINT "FK_ff040d2d2e35c49b00525783829"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_b8128ab843771cf6d42ab3ca188"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_f63c15a47ca5b8f3c2c7564a6be"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_0059ed90877cc0444e487e7670d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_9fd5d6ef620b0140a67ff2d95c4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fees" DROP CONSTRAINT "FK_6b69f3bd75527a53189b1c08a5f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fees" DROP CONSTRAINT "FK_8e42cd61870ee8c71072eff55a3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee_assignments" DROP CONSTRAINT "FK_be103abff56397d4cccb3a79db3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee_assignments" DROP CONSTRAINT "FK_043dd779984ebc0332304d6704d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "results" DROP CONSTRAINT "FK_46e376bbab6f5073210fe39ba5d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "results" DROP CONSTRAINT "FK_1213ca228b65860aaaa9e6fb28c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "results" DROP CONSTRAINT "FK_11e826f5bdc34d0c7c785ec4657"`,
    );
    await queryRunner.query(
      `ALTER TABLE "results" DROP CONSTRAINT "FK_7c5bf104ec5fbc6d177be01af8e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "result_subject_lines" DROP CONSTRAINT "FK_e400231f18da1b391ad34fb8c3b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "result_subject_lines" DROP CONSTRAINT "FK_cfa18ea8b7b83237bdaffa2618f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "session" DROP CONSTRAINT "FK_3d2f174ef04fb312fdebd0ddc53"`,
    );
    await queryRunner.query(
      `ALTER TABLE "superadmin_sessions" DROP CONSTRAINT "FK_926db05e96145ee08e015f65af7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher_subjects" DROP CONSTRAINT "FK_f35ef96bfb3a84b712722d6db70"`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher_subjects" DROP CONSTRAINT "FK_6675136306b9111126bbdbbaba7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_969b3e450b298cc8c6be9028caf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "stream" DROP CONSTRAINT "FK_670f7496ebbd8029b00e80841e7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "class" DROP CONSTRAINT "FK_c07874fd7fa46efbb14dad30005"`,
    );
    await queryRunner.query(
      `ALTER TABLE "timetables" DROP CONSTRAINT "FK_54d3ddcc757a7639a1ca4ea159c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedules" DROP CONSTRAINT "FK_2c027020a88187efddd0dbb8421"`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedules" DROP CONSTRAINT "FK_ea337fc21e4c484e86392809d79"`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedules" DROP CONSTRAINT "FK_2177ec4fc6490209c0b9dcbf206"`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedules" DROP CONSTRAINT "FK_2b9a68c93adbc74afa109bb2a73"`,
    );
    await queryRunner.query(
      `ALTER TABLE "class_subjects" DROP CONSTRAINT "FK_f1406cab45041349673d6887aed"`,
    );
    await queryRunner.query(
      `ALTER TABLE "class_subjects" DROP CONSTRAINT "FK_9d8971acdcc64a1703357a00759"`,
    );
    await queryRunner.query(
      `ALTER TABLE "class_subjects" DROP CONSTRAINT "FK_433f93dd22b685e59c285726a1f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "teachers" DROP CONSTRAINT "FK_4668d4752e6766682d1be0b346f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "class_students" DROP CONSTRAINT "FK_6d12f65ab61f9f92e3d7e95ad23"`,
    );
    await queryRunner.query(
      `ALTER TABLE "class_students" DROP CONSTRAINT "FK_43e081daadb906f3dc41bb267dd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" DROP CONSTRAINT "FK_209313beb8d3f51f7ad69214d90"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" DROP CONSTRAINT "FK_77329d8dd9e1d16f58ad7ad0b3a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" DROP CONSTRAINT "FK_277791be7d963aa0529c476f7d2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" DROP CONSTRAINT "FK_fb3eff90b11bddf7285f9b4e281"`,
    );
    await queryRunner.query(
      `ALTER TABLE "parents" DROP CONSTRAINT "FK_c94c3cea9b43a18c81269ded41d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "class_teachers" DROP CONSTRAINT "FK_504b6c1a3616565a5a1cedcaa63"`,
    );
    await queryRunner.query(
      `ALTER TABLE "class_teachers" DROP CONSTRAINT "FK_1192d6f4432d1de68d66e9a9cd7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "terms" DROP CONSTRAINT "FK_2a45e5f1a157f965dad749ef1dd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP CONSTRAINT "FK_085d540d9f418cfbdc7bd55bb19"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."academic_sessions_status_enum_old" AS ENUM('Active', 'Inactive')`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_sessions" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_sessions" ALTER COLUMN "status" TYPE "public"."academic_sessions_status_enum_old" USING "status"::"text"::"public"."academic_sessions_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_sessions" ALTER COLUMN "status" SET DEFAULT 'Inactive'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."academic_sessions_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."academic_sessions_status_enum_old" RENAME TO "academic_sessions_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_sessions" ADD CONSTRAINT "UQ_5557c033f7a596c8ea80f741841" UNIQUE ("name")`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_sessions" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_sessions" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_sessions" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_sessions" ADD "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ALTER COLUMN "is_active" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ALTER COLUMN "provider" DROP NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "streamId"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_verified"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "home_address"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "UQ_0bd5012aeb82628e07f6a1be53b"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "google_id"`);
    await queryRunner.query(
      `ALTER TABLE "academic_sessions" DROP COLUMN "deleted_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_sessions" DROP COLUMN "description"`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_sessions" DROP CONSTRAINT "UQ_b4b2fcff2d0dc08528c6eaa427d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_sessions" DROP COLUMN "academic_year"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6b4d2abab1dd082a5356bb6058"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a606fe84b86235ee3a1c5dcd06"`,
    );
    await queryRunner.query(`DROP TABLE "fee_classes"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bc5a681d5155da257b53212208"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0dfe6d219c4a7a162ca0f84243"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_dbace05c012526710663f8d891"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9fb6ef15f899489af7e47b6c83"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c51be2c1149e22de76b17626cb"`,
    );
    await queryRunner.query(`DROP TABLE "attendance_records"`);
    await queryRunner.query(
      `DROP TYPE "public"."attendance_records_status_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7f7da705790cfe99d0e2cad8f9"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5ec84a04f80d8b880ba243f217"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b03a45aa2f09370e95f64099b0"`,
    );
    await queryRunner.query(`DROP TABLE "attendance_edit_requests"`);
    await queryRunner.query(
      `DROP TYPE "public"."attendance_edit_requests_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."attendance_edit_requests_attendance_type_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b9dfbb7268b46ca0adf953a39d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0d76bd8d24058e1f0cb521311f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a2f3d140138e4b0ae2ad79a294"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_012380a3d50ecf3c163570360f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e959ecd14c0930e92ee458f4e1"`,
    );
    await queryRunner.query(`DROP TABLE "student_daily_attendance"`);
    await queryRunner.query(
      `DROP TYPE "public"."student_daily_attendance_status_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5750aae3f46e412d7b2c3ea541"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e9813fac28685a38416f693067"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ba382c591eca4c1ce45fb6a086"`,
    );
    await queryRunner.query(`DROP TABLE "teacher_daily_attendance"`);
    await queryRunner.query(
      `DROP TYPE "public"."teacher_daily_attendance_source_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."teacher_daily_attendance_status_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_85cae8a0b9946afe6afec4b095"`,
    );
    await queryRunner.query(`DROP TABLE "teacher_manual_checkins"`);
    await queryRunner.query(
      `DROP TYPE "public"."teacher_manual_checkins_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE "databases"`);
    await queryRunner.query(`DROP TABLE "grades"`);
    await queryRunner.query(`DROP TABLE "grade_submissions"`);
    await queryRunner.query(
      `DROP TYPE "public"."grade_submissions_status_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0843131f4ae91435709527a4f1"`,
    );
    await queryRunner.query(`DROP TABLE "invites"`);
    await queryRunner.query(`DROP TYPE "public"."invites_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ff040d2d2e35c49b0052578382"`,
    );
    await queryRunner.query(`DROP TABLE "notification_preference"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5332a4daa46fd3f4e6625dd275"`,
    );
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."payments_payment_method_enum"`,
    );
    await queryRunner.query(`DROP TABLE "fees"`);
    await queryRunner.query(`DROP TYPE "public"."fees_status_enum"`);
    await queryRunner.query(`DROP TABLE "fee_assignments"`);
    await queryRunner.query(`DROP TABLE "results"`);
    await queryRunner.query(`DROP TABLE "result_subject_lines"`);
    await queryRunner.query(`DROP TABLE "schools"`);
    await queryRunner.query(`DROP TABLE "session"`);
    await queryRunner.query(`DROP TABLE "superadmin_sessions"`);
    await queryRunner.query(`DROP TABLE "superadmin"`);
    await queryRunner.query(`DROP TYPE "public"."superadmin_role_enum"`);
    await queryRunner.query(`DROP TABLE "teacher_profiles"`);
    await queryRunner.query(`DROP TABLE "teacher_subjects"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_670f7496ebbd8029b00e80841e"`,
    );
    await queryRunner.query(`DROP TABLE "stream"`);
    await queryRunner.query(`DROP TABLE "class"`);
    await queryRunner.query(`DROP TABLE "timetables"`);
    await queryRunner.query(`DROP TABLE "schedules"`);
    await queryRunner.query(`DROP TYPE "public"."schedules_period_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."schedules_day_enum"`);
    await queryRunner.query(`DROP TABLE "subjects"`);
    await queryRunner.query(`DROP TABLE "class_subjects"`);
    await queryRunner.query(`DROP TABLE "teachers"`);
    await queryRunner.query(`DROP TYPE "public"."teachers_title_enum"`);
    await queryRunner.query(`DROP TABLE "class_students"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_77329d8dd9e1d16f58ad7ad0b3"`,
    );
    await queryRunner.query(`DROP TABLE "students"`);
    await queryRunner.query(`DROP TABLE "parents"`);
    await queryRunner.query(`DROP TABLE "class_teachers"`);
    await queryRunner.query(`DROP TABLE "rooms"`);
    await queryRunner.query(`DROP TABLE "terms"`);
    await queryRunner.query(`DROP TYPE "public"."terms_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."terms_name_enum"`);
    await queryRunner.query(
      `ALTER TABLE "user_2fa" ADD CONSTRAINT "FK_ed539980faac14226a05368c4d1" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "FK_sessions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
