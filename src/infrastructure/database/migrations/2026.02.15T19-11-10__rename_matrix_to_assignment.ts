import { Migration } from '@mikro-orm/migrations';

export class Migration20260215191110_rename_matrix_to_assignment extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "access_control"."account_role_assignment" ("id" uuid not null default gen_random_uuid(), "account_id" uuid not null, "is_system_managed" boolean not null default false, "role_id" uuid not null, "realm_id" uuid not null, "updated_at" timestamptz(3) null, "created_at" timestamptz(3) not null default now(), "last_actions" jsonb not null default '{}', "is_revoked" boolean not null default false, "version" int not null default 1, constraint "account_role_assignment_pkey" primary key ("id"));`);
    this.addSql(`create index "account_role_assignment_realm_account_idx" on "access_control"."account_role_assignment" ("realm_id", "account_id");`);
    this.addSql(`create index "account_role_assignment_realm_role_idx" on "access_control"."account_role_assignment" ("realm_id", "role_id");`);
    this.addSql(`alter table "access_control"."account_role_assignment" add constraint "account_role_assignment_realm_account_role_unique" unique ("realm_id", "account_id", "role_id");`);

    this.addSql(`create table "access_control"."role_permission_assignment" ("id" uuid not null default gen_random_uuid(), "is_system_managed" boolean not null default false, "role_id" uuid not null, "realm_id" uuid not null, "permission_id" uuid not null, "updated_at" timestamptz(3) null, "created_at" timestamptz(3) not null default now(), "last_actions" jsonb not null default '{}', "is_revoked" boolean not null default false, "version" int not null default 1, constraint "role_permission_assignment_pkey" primary key ("id"));`);
    this.addSql(`create index "role_permission_assignment_realm_permission_idx" on "access_control"."role_permission_assignment" ("realm_id", "permission_id");`);
    this.addSql(`create index "role_permission_assignment_realm_role_idx" on "access_control"."role_permission_assignment" ("realm_id", "role_id");`);
    this.addSql(`alter table "access_control"."role_permission_assignment" add constraint "role_permission_assignment_role_permission_unique" unique ("role_id", "permission_id");`);

    this.addSql(`alter table "access_control"."account_role_assignment" add constraint "account_role_assignment_role_id_foreign" foreign key ("role_id") references "access_control"."role" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table "access_control"."account_role_assignment" add constraint "account_role_assignment_realm_id_foreign" foreign key ("realm_id") references "access_control"."realm" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "access_control"."role_permission_assignment" add constraint "role_permission_assignment_role_id_foreign" foreign key ("role_id") references "access_control"."role" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table "access_control"."role_permission_assignment" add constraint "role_permission_assignment_realm_id_foreign" foreign key ("realm_id") references "access_control"."realm" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table "access_control"."role_permission_assignment" add constraint "role_permission_assignment_permission_id_foreign" foreign key ("permission_id") references "access_control"."permission" ("id") on update cascade on delete cascade;`);

    this.addSql(`drop table if exists "access_control"."account_role_matrix" cascade;`);

    this.addSql(`drop table if exists "access_control"."role_permission_matrix" cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`create table "access_control"."account_role_matrix" ("id" uuid not null default gen_random_uuid(), "account_id" uuid not null, "is_system_managed" boolean not null default false, "role_id" uuid not null, "realm_id" uuid not null, "updated_at" timestamptz(3) null, "created_at" timestamptz(3) not null default now(), "last_actions" jsonb not null default '{}', "is_revoked" boolean not null default false, "version" int not null default 1, constraint "account_role_matrix_pkey" primary key ("id"));`);
    this.addSql(`create index "account_role_matrix_realm_account_idx" on "access_control"."account_role_matrix" ("realm_id", "account_id");`);
    this.addSql(`create index "account_role_matrix_realm_role_idx" on "access_control"."account_role_matrix" ("realm_id", "role_id");`);
    this.addSql(`alter table "access_control"."account_role_matrix" add constraint "account_role_matrix_realm_account_role_unique" unique ("realm_id", "account_id", "role_id");`);

    this.addSql(`create table "access_control"."role_permission_matrix" ("id" uuid not null default gen_random_uuid(), "is_system_managed" boolean not null default false, "role_id" uuid not null, "realm_id" uuid not null, "permission_id" uuid not null, "updated_at" timestamptz(3) null, "created_at" timestamptz(3) not null default now(), "last_actions" jsonb not null default '{}', "is_revoked" boolean not null default false, "version" int not null default 1, constraint "role_permission_matrix_pkey" primary key ("id"));`);
    this.addSql(`create index "role_permission_matrix_realm_permission_idx" on "access_control"."role_permission_matrix" ("realm_id", "permission_id");`);
    this.addSql(`create index "role_permission_matrix_realm_role_idx" on "access_control"."role_permission_matrix" ("realm_id", "role_id");`);
    this.addSql(`alter table "access_control"."role_permission_matrix" add constraint "role_permission_matrix_role_permission_unique" unique ("role_id", "permission_id");`);

    this.addSql(`alter table "access_control"."account_role_matrix" add constraint "account_role_matrix_role_id_foreign" foreign key ("role_id") references "access_control"."role" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table "access_control"."account_role_matrix" add constraint "account_role_matrix_realm_id_foreign" foreign key ("realm_id") references "access_control"."realm" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "access_control"."role_permission_matrix" add constraint "role_permission_matrix_role_id_foreign" foreign key ("role_id") references "access_control"."role" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table "access_control"."role_permission_matrix" add constraint "role_permission_matrix_realm_id_foreign" foreign key ("realm_id") references "access_control"."realm" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table "access_control"."role_permission_matrix" add constraint "role_permission_matrix_permission_id_foreign" foreign key ("permission_id") references "access_control"."permission" ("id") on update cascade on delete cascade;`);

    this.addSql(`drop table if exists "access_control"."account_role_assignment" cascade;`);

    this.addSql(`drop table if exists "access_control"."role_permission_assignment" cascade;`);
  }

}
