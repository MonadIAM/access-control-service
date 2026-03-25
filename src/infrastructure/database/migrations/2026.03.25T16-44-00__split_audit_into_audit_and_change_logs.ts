import { Migration } from '@mikro-orm/migrations';

export class Migration20260325164400_split_audit_into_audit_and_change_logs extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create schema if not exists "tracking";`);
    this.addSql(`create table "tracking"."audit_log" ("id" uuid not null, "action_type" varchar(64) not null, "entity_type" varchar(64) not null, "realm" uuid null, "actor" uuid not null, "ip" varchar(45) null, "user_agent" text null, "input" jsonb null, "created_at" timestamptz(3) not null, constraint "audit_log_pkey" primary key ("id"));`);
    this.addSql(`create index "audit_log_realm_idx" on "tracking"."audit_log" ("realm");`);
    this.addSql(`create index "audit_log_actor_created_at_idx" on "tracking"."audit_log" ("actor", "created_at");`);
    this.addSql(`create index "audit_log_entity_type_action_type_idx" on "tracking"."audit_log" ("entity_type", "action_type");`);

    this.addSql(`create table "tracking"."change_log" ("id" uuid not null, "audit_entry_id" uuid not null, "change_type" varchar(16) not null, "entity_type" varchar(64) not null, "entity" uuid not null, "delta" jsonb not null, "created_at" timestamptz(3) not null, constraint "change_log_pkey" primary key ("id"));`);
    this.addSql(`create index "change_log_audit_entry_idx" on "tracking"."change_log" ("audit_entry_id");`);
    this.addSql(`create index "change_log_entity_type_entity_id_idx" on "tracking"."change_log" ("entity_type", "entity");`);

    this.addSql(`drop table if exists "access_control"."audit_journal" cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`create table "access_control"."audit_journal" ("id" uuid not null, "input" jsonb null, "realm" uuid null, "actor" uuid not null, "user_agent" text null, "ip" text null, "action_type" text check ("action_type" in ('RESTORE', 'REVOKE', 'CREATE', 'UPDATE', 'DELETE')) not null, "entity_type" text check ("entity_type" in ('PERMISSION_ASSIGNMENT', 'PERMISSION_OVERRIDE', 'DELEGATION_POLICY', 'ROLE_ASSIGNMENT', 'CONFLICT_MEMBER', 'CONFLICT_GROUP', 'PERMISSION', 'REALM', 'ROLE')) not null, "created_at" timestamptz(3) not null, constraint "audit_journal_pkey" primary key ("id"));`);
    this.addSql(`create index "audit_journal_realm_idx" on "access_control"."audit_journal" ("realm");`);
    this.addSql(`create index "audit_journal_actor_created_at_idx" on "access_control"."audit_journal" ("actor", "created_at");`);
    this.addSql(`create index "audit_journal_entity_type_action_idx" on "access_control"."audit_journal" ("entity_type", "action_type");`);

    this.addSql(`drop table if exists "tracking"."audit_log" cascade;`);

    this.addSql(`drop table if exists "tracking"."change_log" cascade;`);

    this.addSql(`drop schema if exists "tracking";`);
  }

}
