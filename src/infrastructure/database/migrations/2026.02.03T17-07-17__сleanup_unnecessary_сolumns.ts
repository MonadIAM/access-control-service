import { Migration } from '@mikro-orm/migrations';

export class Migration20260203170717_сleanup_unnecessary_сolumns extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "access_control"."role_conflict_member" drop column "is_inheritable";`);

    this.addSql(`alter table "access_control"."role_delegation_policy" drop column "is_absolute";`);

    this.addSql(`alter table "access_control"."role_delegation_policy" alter column "depth_limit" type smallint using ("depth_limit"::smallint);`);
    this.addSql(`alter table "access_control"."role_delegation_policy" alter column "depth_limit" set default 0;`);
    this.addSql(`alter table "access_control"."role_delegation_policy" alter column "depth_limit" set not null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "access_control"."role_conflict_member" add column "is_inheritable" boolean not null default true;`);

    this.addSql(`alter table "access_control"."role_delegation_policy" add column "is_absolute" boolean not null default false;`);
    this.addSql(`alter table "access_control"."role_delegation_policy" alter column "depth_limit" drop default;`);
    this.addSql(`alter table "access_control"."role_delegation_policy" alter column "depth_limit" type smallint using ("depth_limit"::smallint);`);
    this.addSql(`alter table "access_control"."role_delegation_policy" alter column "depth_limit" drop not null;`);
  }

}
