import { Migration } from '@mikro-orm/migrations';

export class Migration20260202193050_init extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create schema if not exists "access_control";`);
    this.addSql(`create table "access_control"."realm" ("id" uuid not null default gen_random_uuid(), "is_system_managed" boolean not null default false, "code" varchar(128) not null, "name" varchar(255) not null, "description" text null, "updated_at" timestamptz null, "last_actions" jsonb not null default '{}', "created_at" timestamptz not null default now(), "is_revoked" boolean not null default false, "version" int not null default 1, constraint "realm_pkey" primary key ("id"));`);
    this.addSql(`alter table "access_control"."realm" add constraint "realm_code_unique" unique ("code");`);

    this.addSql(`create table "access_control"."permission" ("id" uuid not null default gen_random_uuid(), "is_system_managed" boolean not null default false, "code" varchar(128) not null, "name" varchar(255) not null, "description" text null, "realm_id" uuid not null, "updated_at" timestamptz null, "last_actions" jsonb not null default '{}', "created_at" timestamptz not null default now(), "is_revoked" boolean not null default false, "version" int not null default 1, constraint "permission_pkey" primary key ("id"));`);
    this.addSql(`alter table "access_control"."permission" add constraint "permission_realm_code_unique" unique ("realm_id", "code");`);

    this.addSql(`create table "access_control"."permission_override" ("id" uuid not null default gen_random_uuid(), "account_id" uuid not null, "effect" text check ("effect" in ('allow', 'deny')) not null, "permission_id" uuid not null, "realm_id" uuid not null, "updated_at" timestamptz null, "last_actions" jsonb not null default '{}', "created_at" timestamptz not null default now(), "is_revoked" boolean not null default false, "version" int not null default 1, constraint "permission_override_pkey" primary key ("id"));`);
    this.addSql(`create index "permission_override_realm_account_idx" on "access_control"."permission_override" ("realm_id", "account_id");`);
    this.addSql(`create index "permission_override_realm_permission_idx" on "access_control"."permission_override" ("realm_id", "permission_id");`);
    this.addSql(`alter table "access_control"."permission_override" add constraint "permission_override_realm_account_permission_unique" unique ("realm_id", "account_id", "permission_id");`);

    this.addSql(`create table "access_control"."role" ("id" uuid not null default gen_random_uuid(), "actor_type" text check ("actor_type" in ('SERVICE', 'SYSTEM', 'HUMAN')) not null, "proto_type" text check ("proto_type" in ('COMPOSITE', 'ATOMIC')) not null, "is_system_managed" boolean not null default false, "non_delegable" boolean not null default false, "code" varchar(128) not null, "name" varchar(255) not null, "description" text null, "realm_id" uuid not null, "updated_at" timestamptz null, "last_actions" jsonb not null default '{}', "created_at" timestamptz not null default now(), "is_revoked" boolean not null default false, "version" int not null default 1, constraint "role_pkey" primary key ("id"));`);
    this.addSql(`alter table "access_control"."role" add constraint "role_realm_code_unique" unique ("realm_id", "code");`);

    this.addSql(`create table "access_control"."account_role_matrix" ("id" uuid not null default gen_random_uuid(), "account_id" uuid not null, "is_system_managed" boolean not null default false, "role_id" uuid not null, "realm_id" uuid not null, "updated_at" timestamptz null, "last_actions" jsonb not null default '{}', "created_at" timestamptz not null default now(), "is_revoked" boolean not null default false, "version" int not null default 1, constraint "account_role_matrix_pkey" primary key ("id"));`);
    this.addSql(`create index "account_role_matrix_realm_account_idx" on "access_control"."account_role_matrix" ("realm_id", "account_id");`);
    this.addSql(`create index "account_role_matrix_realm_role_idx" on "access_control"."account_role_matrix" ("realm_id", "role_id");`);
    this.addSql(`alter table "access_control"."account_role_matrix" add constraint "account_role_matrix_realm_account_role_unique" unique ("realm_id", "account_id", "role_id");`);

    this.addSql(`create table "access_control"."role_closure" ("realm_id" uuid not null, "ancestor_id" uuid not null, "descendant_id" uuid not null, "depth" int not null, constraint "role_closure_pkey" primary key ("realm_id", "ancestor_id", "descendant_id"));`);
    this.addSql(`create index "role_closure_realm_ancestor_idx" on "access_control"."role_closure" ("realm_id", "ancestor_id");`);
    this.addSql(`create index "role_closure_realm_descendant_idx" on "access_control"."role_closure" ("realm_id", "descendant_id");`);

    this.addSql(`create table "access_control"."role_conflict_group" ("id" uuid not null default gen_random_uuid(), "is_system_managed" boolean not null default false, "max_allowed" int not null default 1, "code" varchar(128) not null, "name" varchar(255) not null, "description" text null, "realm_id" uuid not null, "updated_at" timestamptz null, "last_actions" jsonb not null default '{}', "created_at" timestamptz not null default now(), "is_revoked" boolean not null default false, "version" int not null default 1, constraint "role_conflict_group_pkey" primary key ("id"));`);
    this.addSql(`alter table "access_control"."role_conflict_group" add constraint "role_conflict_group_realm_code_unique" unique ("realm_id", "code");`);

    this.addSql(`create table "access_control"."role_conflict_member" ("id" uuid not null default gen_random_uuid(), "is_system_managed" boolean not null default false, "is_inheritable" boolean not null default true, "group_id" uuid not null, "role_id" uuid not null, "updated_at" timestamptz null, "last_actions" jsonb not null default '{}', "created_at" timestamptz not null default now(), "is_revoked" boolean not null default false, "version" int not null default 1, constraint "role_conflict_member_pkey" primary key ("id"));`);
    this.addSql(`create index "role_conflict_member_role_idx" on "access_control"."role_conflict_member" ("role_id");`);
    this.addSql(`alter table "access_control"."role_conflict_member" add constraint "role_conflict_member_group_role_unique" unique ("group_id", "role_id");`);

    this.addSql(`create table "access_control"."role_delegation_policy" ("id" uuid not null default gen_random_uuid(), "is_system_managed" boolean not null default false, "is_absolute" boolean not null default false, "depth_limit" smallint null, "description" text null, "realm_id" uuid not null, "delegator_id" uuid not null, "target_id" uuid not null, "updated_at" timestamptz null, "last_actions" jsonb not null default '{}', "created_at" timestamptz not null default now(), "is_revoked" boolean not null default false, "version" int not null default 1, constraint "role_delegation_policy_pkey" primary key ("id"));`);
    this.addSql(`create index "role_delegation_policy_realm_delegator_idx" on "access_control"."role_delegation_policy" ("realm_id", "delegator_id");`);
    this.addSql(`create index "role_delegation_policy_realm_target_idx" on "access_control"."role_delegation_policy" ("realm_id", "target_id");`);
    this.addSql(`alter table "access_control"."role_delegation_policy" add constraint "role_delegation_policy_realm_delegator_target_unique" unique ("realm_id", "delegator_id", "target_id");`);

    this.addSql(`create table "access_control"."role_permission_matrix" ("id" uuid not null default gen_random_uuid(), "is_system_managed" boolean not null default false, "role_id" uuid not null, "permission_id" uuid not null, "updated_at" timestamptz null, "last_actions" jsonb not null default '{}', "created_at" timestamptz not null default now(), "is_revoked" boolean not null default false, "version" int not null default 1, constraint "role_permission_matrix_pkey" primary key ("id"));`);
    this.addSql(`create index "role_permission_matrix_permission_idx" on "access_control"."role_permission_matrix" ("permission_id");`);
    this.addSql(`create index "role_permission_matrix_role_idx" on "access_control"."role_permission_matrix" ("role_id");`);
    this.addSql(`alter table "access_control"."role_permission_matrix" add constraint "role_permission_matrix_role_permission_unique" unique ("role_id", "permission_id");`);

    this.addSql(`alter table "access_control"."permission" add constraint "permission_realm_id_foreign" foreign key ("realm_id") references "access_control"."realm" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "access_control"."permission_override" add constraint "permission_override_permission_id_foreign" foreign key ("permission_id") references "access_control"."permission" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table "access_control"."permission_override" add constraint "permission_override_realm_id_foreign" foreign key ("realm_id") references "access_control"."realm" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "access_control"."role" add constraint "role_realm_id_foreign" foreign key ("realm_id") references "access_control"."realm" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "access_control"."account_role_matrix" add constraint "account_role_matrix_role_id_foreign" foreign key ("role_id") references "access_control"."role" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table "access_control"."account_role_matrix" add constraint "account_role_matrix_realm_id_foreign" foreign key ("realm_id") references "access_control"."realm" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "access_control"."role_closure" add constraint "role_closure_realm_id_foreign" foreign key ("realm_id") references "access_control"."realm" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table "access_control"."role_closure" add constraint "role_closure_ancestor_id_foreign" foreign key ("ancestor_id") references "access_control"."role" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table "access_control"."role_closure" add constraint "role_closure_descendant_id_foreign" foreign key ("descendant_id") references "access_control"."role" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "access_control"."role_conflict_group" add constraint "role_conflict_group_realm_id_foreign" foreign key ("realm_id") references "access_control"."realm" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "access_control"."role_conflict_member" add constraint "role_conflict_member_group_id_foreign" foreign key ("group_id") references "access_control"."role_conflict_group" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table "access_control"."role_conflict_member" add constraint "role_conflict_member_role_id_foreign" foreign key ("role_id") references "access_control"."role" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "access_control"."role_delegation_policy" add constraint "role_delegation_policy_realm_id_foreign" foreign key ("realm_id") references "access_control"."realm" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table "access_control"."role_delegation_policy" add constraint "role_delegation_policy_delegator_id_foreign" foreign key ("delegator_id") references "access_control"."role" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table "access_control"."role_delegation_policy" add constraint "role_delegation_policy_target_id_foreign" foreign key ("target_id") references "access_control"."role" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "access_control"."role_permission_matrix" add constraint "role_permission_matrix_role_id_foreign" foreign key ("role_id") references "access_control"."role" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table "access_control"."role_permission_matrix" add constraint "role_permission_matrix_permission_id_foreign" foreign key ("permission_id") references "access_control"."permission" ("id") on update cascade on delete cascade;`);
  }

}
