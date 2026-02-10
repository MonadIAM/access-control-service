import { Migration } from '@mikro-orm/migrations';

export class Migration20260210122014_set_timestamp_precision_to_ms extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "access_control"."audit_journal" alter column "at" type timestamptz(3) using ("at"::timestamptz(3));`);
    this.addSql(`alter table "access_control"."audit_journal" alter column "created_at" type timestamptz(3) using ("created_at"::timestamptz(3));`);

    this.addSql(`alter table "access_control"."realm" alter column "updated_at" type timestamptz(3) using ("updated_at"::timestamptz(3));`);
    this.addSql(`alter table "access_control"."realm" alter column "created_at" type timestamptz(3) using ("created_at"::timestamptz(3));`);

    this.addSql(`alter table "access_control"."permission" alter column "updated_at" type timestamptz(3) using ("updated_at"::timestamptz(3));`);
    this.addSql(`alter table "access_control"."permission" alter column "created_at" type timestamptz(3) using ("created_at"::timestamptz(3));`);

    this.addSql(`alter table "access_control"."permission_override" alter column "updated_at" type timestamptz(3) using ("updated_at"::timestamptz(3));`);
    this.addSql(`alter table "access_control"."permission_override" alter column "created_at" type timestamptz(3) using ("created_at"::timestamptz(3));`);

    this.addSql(`alter table "access_control"."role" alter column "updated_at" type timestamptz(3) using ("updated_at"::timestamptz(3));`);
    this.addSql(`alter table "access_control"."role" alter column "created_at" type timestamptz(3) using ("created_at"::timestamptz(3));`);

    this.addSql(`alter table "access_control"."account_role_matrix" alter column "updated_at" type timestamptz(3) using ("updated_at"::timestamptz(3));`);
    this.addSql(`alter table "access_control"."account_role_matrix" alter column "created_at" type timestamptz(3) using ("created_at"::timestamptz(3));`);

    this.addSql(`alter table "access_control"."role_conflict_group" alter column "updated_at" type timestamptz(3) using ("updated_at"::timestamptz(3));`);
    this.addSql(`alter table "access_control"."role_conflict_group" alter column "created_at" type timestamptz(3) using ("created_at"::timestamptz(3));`);

    this.addSql(`alter table "access_control"."role_conflict_member" alter column "updated_at" type timestamptz(3) using ("updated_at"::timestamptz(3));`);
    this.addSql(`alter table "access_control"."role_conflict_member" alter column "created_at" type timestamptz(3) using ("created_at"::timestamptz(3));`);

    this.addSql(`alter table "access_control"."role_delegation_policy" alter column "updated_at" type timestamptz(3) using ("updated_at"::timestamptz(3));`);
    this.addSql(`alter table "access_control"."role_delegation_policy" alter column "created_at" type timestamptz(3) using ("created_at"::timestamptz(3));`);

    this.addSql(`alter table "access_control"."role_permission_matrix" alter column "updated_at" type timestamptz(3) using ("updated_at"::timestamptz(3));`);
    this.addSql(`alter table "access_control"."role_permission_matrix" alter column "created_at" type timestamptz(3) using ("created_at"::timestamptz(3));`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "access_control"."audit_journal" alter column "at" type timestamptz using ("at"::timestamptz);`);
    this.addSql(`alter table "access_control"."audit_journal" alter column "created_at" type timestamptz using ("created_at"::timestamptz);`);

    this.addSql(`alter table "access_control"."realm" alter column "updated_at" type timestamptz using ("updated_at"::timestamptz);`);
    this.addSql(`alter table "access_control"."realm" alter column "created_at" type timestamptz using ("created_at"::timestamptz);`);

    this.addSql(`alter table "access_control"."permission" alter column "updated_at" type timestamptz using ("updated_at"::timestamptz);`);
    this.addSql(`alter table "access_control"."permission" alter column "created_at" type timestamptz using ("created_at"::timestamptz);`);

    this.addSql(`alter table "access_control"."permission_override" alter column "updated_at" type timestamptz using ("updated_at"::timestamptz);`);
    this.addSql(`alter table "access_control"."permission_override" alter column "created_at" type timestamptz using ("created_at"::timestamptz);`);

    this.addSql(`alter table "access_control"."role" alter column "updated_at" type timestamptz using ("updated_at"::timestamptz);`);
    this.addSql(`alter table "access_control"."role" alter column "created_at" type timestamptz using ("created_at"::timestamptz);`);

    this.addSql(`alter table "access_control"."account_role_matrix" alter column "updated_at" type timestamptz using ("updated_at"::timestamptz);`);
    this.addSql(`alter table "access_control"."account_role_matrix" alter column "created_at" type timestamptz using ("created_at"::timestamptz);`);

    this.addSql(`alter table "access_control"."role_conflict_group" alter column "updated_at" type timestamptz using ("updated_at"::timestamptz);`);
    this.addSql(`alter table "access_control"."role_conflict_group" alter column "created_at" type timestamptz using ("created_at"::timestamptz);`);

    this.addSql(`alter table "access_control"."role_conflict_member" alter column "updated_at" type timestamptz using ("updated_at"::timestamptz);`);
    this.addSql(`alter table "access_control"."role_conflict_member" alter column "created_at" type timestamptz using ("created_at"::timestamptz);`);

    this.addSql(`alter table "access_control"."role_delegation_policy" alter column "updated_at" type timestamptz using ("updated_at"::timestamptz);`);
    this.addSql(`alter table "access_control"."role_delegation_policy" alter column "created_at" type timestamptz using ("created_at"::timestamptz);`);

    this.addSql(`alter table "access_control"."role_permission_matrix" alter column "updated_at" type timestamptz using ("updated_at"::timestamptz);`);
    this.addSql(`alter table "access_control"."role_permission_matrix" alter column "created_at" type timestamptz using ("created_at"::timestamptz);`);
  }

}
