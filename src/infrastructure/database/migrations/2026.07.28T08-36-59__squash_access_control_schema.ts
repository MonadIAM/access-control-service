import { Migration } from '@mikro-orm/migrations';

export class Migration20260728083659_squash_access_control_schema extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);

    this.addSql(`create schema if not exists "system";`);
    this.addSql(`create schema if not exists "access_control";`);
    this.addSql(`create table "system"."audit_log" ("id" uuid not null, "action_type" varchar(64) not null, "entity_type" varchar(64) not null, "realm" uuid null, "actor" uuid not null, "ip" varchar(45) null, "user_agent" text null, "input" jsonb null, "created_at" timestamptz(3) not null, primary key ("id"));`);
    this.addSql(`create index "audit_log_realm_idx" on "system"."audit_log" ("realm");`);
    this.addSql(`create index "audit_log_actor_created_at_idx" on "system"."audit_log" ("actor", "created_at");`);
    this.addSql(`create index "audit_log_entity_type_action_type_idx" on "system"."audit_log" ("entity_type", "action_type");`);

    this.addSql(`create table "system"."change_log" ("id" uuid not null, "audit_entry_id" uuid not null, "change_type" varchar(16) not null, "entity_type" varchar(64) not null, "entity" uuid not null, "delta" jsonb not null, "created_at" timestamptz(3) not null, primary key ("id"));`);
    this.addSql(`create index "change_log_audit_entry_idx" on "system"."change_log" ("audit_entry_id");`);
    this.addSql(`create index "change_log_entity_type_entity_id_idx" on "system"."change_log" ("entity_type", "entity");`);

    this.addSql(`create table "system"."outbox" ("id" uuid not null, "sequence_number" bigserial, "action_type" varchar(64) not null, "destination_topic" varchar(128) not null, "payload" jsonb not null, "metadata" jsonb null, "created_at" timestamptz(3) not null, primary key ("id"));`);
    this.addSql(`create index "outbox_sequence_number_idx" on "system"."outbox" ("sequence_number");`);

    this.addSql(`create table "access_control"."realm" ("id" uuid not null, "description" text null, "code" varchar(128) not null, "name" varchar(255) not null, "owner" uuid not null, "is_system_managed" boolean not null, "is_revoked" boolean not null, "updated_at" timestamptz(3) null, "created_at" timestamptz(3) not null, "version" int not null default 1, primary key ("id"));`);
    this.addSql(`CREATE INDEX "realm_name_trgm_idx" ON "access_control"."realm" USING gin ("name" gin_trgm_ops);`);
    this.addSql(`create index "realm_owner_idx" on "access_control"."realm" ("owner");`);
    this.addSql(`alter table "access_control"."realm" add constraint "realm_code_unique" unique ("code");`);

    this.addSql(`create table "access_control"."permission" ("id" uuid not null, "code" varchar(128) not null, "name" varchar(255) not null, "description" text null, "is_system_managed" boolean not null, "is_revoked" boolean not null, "realm_id" uuid not null, "updated_at" timestamptz(3) null, "created_at" timestamptz(3) not null, "version" int not null default 1, primary key ("id"));`);
    this.addSql(`CREATE INDEX "permission_name_trgm_idx" ON "access_control"."permission" USING gin ("name" gin_trgm_ops);`);
    this.addSql(`alter table "access_control"."permission" add constraint "permission_realm_code_unique" unique ("realm_id", "code");`);

    this.addSql(`create table "access_control"."permission_override" ("id" uuid not null, "account" uuid not null, "effect" text not null, "is_revoked" boolean not null, "permission_id" uuid not null, "realm_id" uuid not null, "updated_at" timestamptz(3) null, "created_at" timestamptz(3) not null, "version" int not null default 1, primary key ("id"));`);
    this.addSql(`create index "permission_override_account_idx" on "access_control"."permission_override" ("account");`);
    this.addSql(`create index "permission_override_permission_idx" on "access_control"."permission_override" ("permission_id");`);
    this.addSql(`alter table "access_control"."permission_override" add constraint "permission_override_realm_account_permission_unique" unique ("realm_id", "account", "permission_id");`);

    this.addSql(`create table "access_control"."role" ("id" uuid not null, "code" varchar(128) not null, "name" varchar(255) not null, "description" text null, "actor_type" text not null, "archetype" text not null, "is_system_managed" boolean not null, "non_delegable" boolean not null, "is_revoked" boolean not null, "realm_id" uuid not null, "updated_at" timestamptz(3) null, "created_at" timestamptz(3) not null, "version" int not null default 1, primary key ("id"));`);
    this.addSql(`CREATE INDEX "role_name_trgm_idx" ON "access_control"."role" USING gin ("name" gin_trgm_ops);`);
    this.addSql(`alter table "access_control"."role" add constraint "role_realm_code_unique" unique ("realm_id", "code");`);

    this.addSql(`create table "access_control"."invite" ("id" uuid not null, "status" text not null, "invitee" uuid not null, "inviter" uuid not null, "realm_id" uuid not null, "role_id" uuid not null, "updated_at" timestamptz(3) null, "created_at" timestamptz(3) not null, "version" int not null default 1, primary key ("id"));`);
    this.addSql(`create index "invite_invitee_idx" on "access_control"."invite" ("invitee");`);
    this.addSql(`create index "invite_inviter_idx" on "access_control"."invite" ("inviter");`);
    this.addSql(`CREATE UNIQUE INDEX "invite_realm_invitee_role_pending_unique" ON "access_control"."invite" ("realm_id", "invitee", "role_id") WHERE "status" = 'PENDING';`);

    this.addSql(`create table "access_control"."account_role_assignment" ("id" uuid not null, "account" uuid not null, "is_system_managed" boolean not null, "is_revoked" boolean not null, "role_id" uuid not null, "realm_id" uuid not null, "updated_at" timestamptz(3) null, "created_at" timestamptz(3) not null, "version" int not null default 1, primary key ("id"));`);
    this.addSql(`create index "account_role_assignment_account_idx" on "access_control"."account_role_assignment" ("account");`);
    this.addSql(`create index "account_role_assignment_role_idx" on "access_control"."account_role_assignment" ("role_id");`);
    this.addSql(`alter table "access_control"."account_role_assignment" add constraint "account_role_assignment_realm_account_role_unique" unique ("realm_id", "account", "role_id");`);

    this.addSql(`create table "access_control"."role_closure" ("realm_id" uuid not null, "ancestor_id" uuid not null, "descendant_id" uuid not null, "depth" int not null, primary key ("realm_id", "ancestor_id", "descendant_id"));`);
    this.addSql(`create index "role_closure_ancestor_depth_idx" on "access_control"."role_closure" ("ancestor_id", "depth");`);
    this.addSql(`create index "role_closure_descendant_depth_idx" on "access_control"."role_closure" ("descendant_id", "depth");`);

    this.addSql(`create table "access_control"."role_conflict_group" ("id" uuid not null, "code" varchar(128) not null, "name" varchar(255) not null, "description" text null, "max_allowed" int not null, "is_system_managed" boolean not null, "is_revoked" boolean not null, "realm_id" uuid not null, "updated_at" timestamptz(3) null, "created_at" timestamptz(3) not null, "version" int not null default 1, primary key ("id"));`);
    this.addSql(`alter table "access_control"."role_conflict_group" add constraint "role_conflict_group_realm_code_unique" unique ("realm_id", "code");`);

    this.addSql(`create table "access_control"."role_conflict_member" ("id" uuid not null, "is_system_managed" boolean not null, "is_revoked" boolean not null, "group_id" uuid not null, "role_id" uuid not null, "updated_at" timestamptz(3) null, "created_at" timestamptz(3) not null, "version" int not null default 1, primary key ("id"));`);
    this.addSql(`create index "role_conflict_member_role_idx" on "access_control"."role_conflict_member" ("role_id");`);
    this.addSql(`alter table "access_control"."role_conflict_member" add constraint "role_conflict_member_group_role_unique" unique ("group_id", "role_id");`);

    this.addSql(`create table "access_control"."role_delegation_policy" ("id" uuid not null, "description" text null, "depth_limit" smallint not null, "is_system_managed" boolean not null, "is_revoked" boolean not null, "realm_id" uuid not null, "delegator_id" uuid not null, "target_id" uuid not null, "updated_at" timestamptz(3) null, "created_at" timestamptz(3) not null, "version" int not null default 1, primary key ("id"));`);
    this.addSql(`create index "role_delegation_policy_delegator_idx" on "access_control"."role_delegation_policy" ("delegator_id");`);
    this.addSql(`create index "role_delegation_policy_target_idx" on "access_control"."role_delegation_policy" ("target_id");`);
    this.addSql(`alter table "access_control"."role_delegation_policy" add constraint "role_delegation_policy_realm_delegator_target_unique" unique ("realm_id", "delegator_id", "target_id");`);

    this.addSql(`create table "access_control"."role_permission_assignment" ("id" uuid not null, "scope" text not null, "is_system_managed" boolean not null, "is_revoked" boolean not null, "role_id" uuid not null, "realm_id" uuid not null, "permission_id" uuid not null, "updated_at" timestamptz(3) null, "created_at" timestamptz(3) not null, "version" int not null default 1, primary key ("id"));`);
    this.addSql(`create index "role_permission_assignment_permission_idx" on "access_control"."role_permission_assignment" ("permission_id");`);
    this.addSql(`create index "role_permission_assignment_realm_idx" on "access_control"."role_permission_assignment" ("realm_id");`);
    this.addSql(`alter table "access_control"."role_permission_assignment" add constraint "role_permission_assignment_role_permission_unique" unique ("role_id", "permission_id");`);

    this.addSql(`alter table "access_control"."permission" add constraint "permission_realm_id_foreign" foreign key ("realm_id") references "access_control"."realm" ("id") on delete cascade;`);

    this.addSql(`alter table "access_control"."permission_override" add constraint "permission_override_permission_id_foreign" foreign key ("permission_id") references "access_control"."permission" ("id") on delete cascade;`);
    this.addSql(`alter table "access_control"."permission_override" add constraint "permission_override_realm_id_foreign" foreign key ("realm_id") references "access_control"."realm" ("id") on delete cascade;`);
    this.addSql(`alter table "access_control"."permission_override" add constraint "permission_override_effect_check" check ("effect" in ('ALLOW', 'DENY'));`);

    this.addSql(`alter table "access_control"."role" add constraint "role_realm_id_foreign" foreign key ("realm_id") references "access_control"."realm" ("id") on delete cascade;`);
    this.addSql(`alter table "access_control"."role" add constraint "role_actor_type_check" check ("actor_type" in ('SERVICE', 'SYSTEM', 'HUMAN'));`);
    this.addSql(`alter table "access_control"."role" add constraint "role_archetype_check" check ("archetype" in ('COMPOSITE', 'ATOMIC'));`);

    this.addSql(`alter table "access_control"."invite" add constraint "invite_realm_id_foreign" foreign key ("realm_id") references "access_control"."realm" ("id") on delete cascade;`);
    this.addSql(`alter table "access_control"."invite" add constraint "invite_role_id_foreign" foreign key ("role_id") references "access_control"."role" ("id") on delete cascade;`);
    this.addSql(`alter table "access_control"."invite" add constraint "invite_status_check" check ("status" in ('CANCELLED', 'ACCEPTED', 'DECLINED', 'PENDING'));`);

    this.addSql(`alter table "access_control"."account_role_assignment" add constraint "account_role_assignment_role_id_foreign" foreign key ("role_id") references "access_control"."role" ("id") on delete cascade;`);
    this.addSql(`alter table "access_control"."account_role_assignment" add constraint "account_role_assignment_realm_id_foreign" foreign key ("realm_id") references "access_control"."realm" ("id") on delete cascade;`);

    this.addSql(`alter table "access_control"."role_closure" add constraint "role_closure_realm_id_foreign" foreign key ("realm_id") references "access_control"."realm" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table "access_control"."role_closure" add constraint "role_closure_ancestor_id_foreign" foreign key ("ancestor_id") references "access_control"."role" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table "access_control"."role_closure" add constraint "role_closure_descendant_id_foreign" foreign key ("descendant_id") references "access_control"."role" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "access_control"."role_conflict_group" add constraint "role_conflict_group_realm_id_foreign" foreign key ("realm_id") references "access_control"."realm" ("id") on delete cascade;`);

    this.addSql(`alter table "access_control"."role_conflict_member" add constraint "role_conflict_member_group_id_foreign" foreign key ("group_id") references "access_control"."role_conflict_group" ("id") on delete cascade;`);
    this.addSql(`alter table "access_control"."role_conflict_member" add constraint "role_conflict_member_role_id_foreign" foreign key ("role_id") references "access_control"."role" ("id") on delete cascade;`);

    this.addSql(`alter table "access_control"."role_delegation_policy" add constraint "role_delegation_policy_realm_id_foreign" foreign key ("realm_id") references "access_control"."realm" ("id") on delete cascade;`);
    this.addSql(`alter table "access_control"."role_delegation_policy" add constraint "role_delegation_policy_delegator_id_foreign" foreign key ("delegator_id") references "access_control"."role" ("id") on delete cascade;`);
    this.addSql(`alter table "access_control"."role_delegation_policy" add constraint "role_delegation_policy_target_id_foreign" foreign key ("target_id") references "access_control"."role" ("id") on delete cascade;`);

    this.addSql(`alter table "access_control"."role_permission_assignment" add constraint "role_permission_assignment_role_id_foreign" foreign key ("role_id") references "access_control"."role" ("id") on delete cascade;`);
    this.addSql(`alter table "access_control"."role_permission_assignment" add constraint "role_permission_assignment_realm_id_foreign" foreign key ("realm_id") references "access_control"."realm" ("id") on delete cascade;`);
    this.addSql(`alter table "access_control"."role_permission_assignment" add constraint "role_permission_assignment_permission_id_foreign" foreign key ("permission_id") references "access_control"."permission" ("id") on delete cascade;`);
    this.addSql(`alter table "access_control"."role_permission_assignment" add constraint "role_permission_assignment_scope_check" check ("scope" in ('REALM', 'GLOBAL'));`);
  }

  override down(): void | Promise<void> {
    this.addSql(`DROP EXTENSION IF EXISTS pg_trgm;`);

    this.addSql(`alter table "access_control"."permission" drop constraint "permission_realm_id_foreign";`);
    this.addSql(`alter table "access_control"."permission_override" drop constraint "permission_override_realm_id_foreign";`);
    this.addSql(`alter table "access_control"."role" drop constraint "role_realm_id_foreign";`);
    this.addSql(`alter table "access_control"."invite" drop constraint "invite_realm_id_foreign";`);
    this.addSql(`alter table "access_control"."account_role_assignment" drop constraint "account_role_assignment_realm_id_foreign";`);
    this.addSql(`alter table "access_control"."role_closure" drop constraint "role_closure_realm_id_foreign";`);
    this.addSql(`alter table "access_control"."role_conflict_group" drop constraint "role_conflict_group_realm_id_foreign";`);
    this.addSql(`alter table "access_control"."role_delegation_policy" drop constraint "role_delegation_policy_realm_id_foreign";`);
    this.addSql(`alter table "access_control"."role_permission_assignment" drop constraint "role_permission_assignment_realm_id_foreign";`);
    this.addSql(`alter table "access_control"."permission_override" drop constraint "permission_override_permission_id_foreign";`);
    this.addSql(`alter table "access_control"."role_permission_assignment" drop constraint "role_permission_assignment_permission_id_foreign";`);
    this.addSql(`alter table "access_control"."invite" drop constraint "invite_role_id_foreign";`);
    this.addSql(`alter table "access_control"."account_role_assignment" drop constraint "account_role_assignment_role_id_foreign";`);
    this.addSql(`alter table "access_control"."role_closure" drop constraint "role_closure_ancestor_id_foreign";`);
    this.addSql(`alter table "access_control"."role_closure" drop constraint "role_closure_descendant_id_foreign";`);
    this.addSql(`alter table "access_control"."role_conflict_member" drop constraint "role_conflict_member_role_id_foreign";`);
    this.addSql(`alter table "access_control"."role_delegation_policy" drop constraint "role_delegation_policy_delegator_id_foreign";`);
    this.addSql(`alter table "access_control"."role_delegation_policy" drop constraint "role_delegation_policy_target_id_foreign";`);
    this.addSql(`alter table "access_control"."role_permission_assignment" drop constraint "role_permission_assignment_role_id_foreign";`);
    this.addSql(`alter table "access_control"."role_conflict_member" drop constraint "role_conflict_member_group_id_foreign";`);

    this.addSql(`drop table if exists "system"."audit_log" cascade;`);
    this.addSql(`drop table if exists "system"."change_log" cascade;`);
    this.addSql(`drop table if exists "system"."outbox" cascade;`);
    this.addSql(`drop table if exists "access_control"."realm" cascade;`);
    this.addSql(`drop table if exists "access_control"."permission" cascade;`);
    this.addSql(`drop table if exists "access_control"."permission_override" cascade;`);
    this.addSql(`drop table if exists "access_control"."role" cascade;`);
    this.addSql(`drop table if exists "access_control"."invite" cascade;`);
    this.addSql(`drop table if exists "access_control"."account_role_assignment" cascade;`);
    this.addSql(`drop table if exists "access_control"."role_closure" cascade;`);
    this.addSql(`drop table if exists "access_control"."role_conflict_group" cascade;`);
    this.addSql(`drop table if exists "access_control"."role_conflict_member" cascade;`);
    this.addSql(`drop table if exists "access_control"."role_delegation_policy" cascade;`);
    this.addSql(`drop table if exists "access_control"."role_permission_assignment" cascade;`);

    this.addSql(`drop schema if exists "system";`);
    this.addSql(`drop schema if exists "access_control";`);
  }

}
