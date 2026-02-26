import { Migration } from '@mikro-orm/migrations';

export class Migration20260226225444_normalize_account_field_naming extends Migration {

  override async up(): Promise<void> {
    this.addSql(`drop index "access_control"."permission_override_realm_account_idx";`);
    this.addSql(`alter table "access_control"."permission_override" drop constraint "permission_override_realm_account_permission_unique";`);

    this.addSql(`alter table "access_control"."permission_override" rename column "account_id" to "account";`);
    this.addSql(`create index "permission_override_realm_account_idx" on "access_control"."permission_override" ("realm_id", "account");`);
    this.addSql(`alter table "access_control"."permission_override" add constraint "permission_override_realm_account_permission_unique" unique ("realm_id", "account", "permission_id");`);

    this.addSql(`drop index "access_control"."account_role_assignment_realm_account_idx";`);
    this.addSql(`alter table "access_control"."account_role_assignment" drop constraint "account_role_assignment_realm_account_role_unique";`);

    this.addSql(`alter table "access_control"."account_role_assignment" rename column "account_id" to "account";`);
    this.addSql(`create index "account_role_assignment_realm_account_idx" on "access_control"."account_role_assignment" ("realm_id", "account");`);
    this.addSql(`alter table "access_control"."account_role_assignment" add constraint "account_role_assignment_realm_account_role_unique" unique ("realm_id", "account", "role_id");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index "access_control"."permission_override_realm_account_idx";`);
    this.addSql(`alter table "access_control"."permission_override" drop constraint "permission_override_realm_account_permission_unique";`);

    this.addSql(`alter table "access_control"."permission_override" rename column "account" to "account_id";`);
    this.addSql(`create index "permission_override_realm_account_idx" on "access_control"."permission_override" ("realm_id", "account_id");`);
    this.addSql(`alter table "access_control"."permission_override" add constraint "permission_override_realm_account_permission_unique" unique ("realm_id", "account_id", "permission_id");`);

    this.addSql(`drop index "access_control"."account_role_assignment_realm_account_idx";`);
    this.addSql(`alter table "access_control"."account_role_assignment" drop constraint "account_role_assignment_realm_account_role_unique";`);

    this.addSql(`alter table "access_control"."account_role_assignment" rename column "account" to "account_id";`);
    this.addSql(`create index "account_role_assignment_realm_account_idx" on "access_control"."account_role_assignment" ("realm_id", "account_id");`);
    this.addSql(`alter table "access_control"."account_role_assignment" add constraint "account_role_assignment_realm_account_role_unique" unique ("realm_id", "account_id", "role_id");`);
  }

}
