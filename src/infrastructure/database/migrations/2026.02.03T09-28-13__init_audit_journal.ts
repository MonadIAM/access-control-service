import { Migration } from '@mikro-orm/migrations';

export class Migration20260203092813_init_audit_journal extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "access_control"."audit_journal" ("id" uuid not null default gen_random_uuid(), "entity_id" uuid not null, "realm_id" uuid not null, "by" uuid not null, "at" timestamptz not null, "reason" text null, "patch" jsonb null, "ip" text null, "user_agent" text null, "action" text check ("action" in ('restore', 'revoke', 'create', 'update', 'delete')) not null, "entity" text check ("entity" in ('permission_assignment', 'permission_override', 'delegation_policy', 'role_assignment', 'conflict_member', 'conflict_group', 'permission', 'realm', 'role')) not null, "created_at" timestamptz not null default now(), constraint "audit_journal_pkey" primary key ("id"));`);
    this.addSql(`create index "audit_journal_entity_idx" on "access_control"."audit_journal" ("entity", "entity_id");`);
    this.addSql(`create index "audit_journal_realm_idx" on "access_control"."audit_journal" ("realm_id");`);
    this.addSql(`create index "audit_journal_by_at_idx" on "access_control"."audit_journal" ("by", "at");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "access_control"."audit_journal" cascade;`);
  }

}
