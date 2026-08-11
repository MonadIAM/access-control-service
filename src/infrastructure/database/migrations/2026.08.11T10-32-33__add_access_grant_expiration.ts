import { Migration } from '@mikro-orm/migrations';

export class Migration20260811103233_add_access_grant_expiration extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`alter table "access_control"."permission_override" add "expires_at" timestamptz(3) null;`);
    this.addSql(`create index "permission_override_expires_at_idx" on "access_control"."permission_override" ("expires_at");`);

    this.addSql(`alter table "access_control"."account_role_assignment" add "expires_at" timestamptz(3) null;`);
    this.addSql(`create index "account_role_assignment_expires_at_idx" on "access_control"."account_role_assignment" ("expires_at");`);

    this.addSql(`alter table "access_control"."role_delegation_policy" add "expires_at" timestamptz(3) null;`);
    this.addSql(`create index "role_delegation_policy_expires_at_idx" on "access_control"."role_delegation_policy" ("expires_at");`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop index "access_control"."account_role_assignment_expires_at_idx";`);
    this.addSql(`alter table "access_control"."account_role_assignment" drop column "expires_at";`);

    this.addSql(`drop index "access_control"."permission_override_expires_at_idx";`);
    this.addSql(`alter table "access_control"."permission_override" drop column "expires_at";`);

    this.addSql(`drop index "access_control"."role_delegation_policy_expires_at_idx";`);
    this.addSql(`alter table "access_control"."role_delegation_policy" drop column "expires_at";`);
  }

}
