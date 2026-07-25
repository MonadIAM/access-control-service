import { Migration } from '@mikro-orm/migrations';

export class Migration20260725200246_merge_projection_journal_into_outbox extends Migration {

  override async up(): Promise<void> {
    this.addSql(`drop table if exists "system"."projection_journal" cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`create table "system"."projection_journal" ("id" uuid not null, "operation_type" varchar(128) not null, "payload" jsonb not null, "status" text check ("status" in ('PROCESSING', 'PENDING', 'APPLIED', 'FAILED', 'DEAD')) not null, "attempts" int not null, "last_error" text null, "available_at" timestamptz(3) not null, "locked_at" timestamptz(3) null, "locked_by" varchar(128) null, "applied_at" timestamptz(3) null, "created_at" timestamptz(3) not null, constraint "projection_journal_pkey" primary key ("id"));`);
    this.addSql(`create index "projection_journal_status_available_idx" on "system"."projection_journal" ("status", "available_at", "created_at");`);
    this.addSql(`create index "projection_journal_processing_lock_idx" on "system"."projection_journal" ("status", "locked_at");`);
    this.addSql(`create index "projection_journal_applied_at_idx" on "system"."projection_journal" ("applied_at");`);
  }

}
