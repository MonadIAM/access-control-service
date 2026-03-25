import { Migration } from '@mikro-orm/migrations';

export class Migration20260325190157_drop_last_actions_column extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "access_control"."realm" drop column "last_actions";`);

    this.addSql(`alter table "access_control"."permission" drop column "last_actions";`);

    this.addSql(`alter table "access_control"."permission_override" drop column "last_actions";`);

    this.addSql(`alter table "access_control"."role" drop column "last_actions";`);

    this.addSql(`alter table "access_control"."account_role_assignment" drop column "last_actions";`);

    this.addSql(`alter table "access_control"."role_conflict_group" drop column "last_actions";`);

    this.addSql(`alter table "access_control"."role_conflict_member" drop column "last_actions";`);

    this.addSql(`alter table "access_control"."role_delegation_policy" drop column "last_actions";`);

    this.addSql(`alter table "access_control"."role_permission_assignment" drop column "last_actions";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "access_control"."realm" add column "last_actions" jsonb not null;`);

    this.addSql(`alter table "access_control"."permission" add column "last_actions" jsonb not null;`);

    this.addSql(`alter table "access_control"."permission_override" add column "last_actions" jsonb not null;`);

    this.addSql(`alter table "access_control"."role" add column "last_actions" jsonb not null;`);

    this.addSql(`alter table "access_control"."account_role_assignment" add column "last_actions" jsonb not null;`);

    this.addSql(`alter table "access_control"."role_conflict_group" add column "last_actions" jsonb not null;`);

    this.addSql(`alter table "access_control"."role_conflict_member" add column "last_actions" jsonb not null;`);

    this.addSql(`alter table "access_control"."role_delegation_policy" add column "last_actions" jsonb not null;`);

    this.addSql(`alter table "access_control"."role_permission_assignment" add column "last_actions" jsonb not null;`);
  }

}
