import { Migration } from '@mikro-orm/migrations';

export class Migration20260225001146_add_role_permission_assignment_scope extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "access_control"."role_permission_assignment" add column "scope" text check ("scope" in ('REALM', 'GLOBAL')) not null;`);
    this.addSql(`create index "role_permission_assignment_scope_idx" on "access_control"."role_permission_assignment" ("scope");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index "access_control"."role_permission_assignment_scope_idx";`);
    this.addSql(`alter table "access_control"."role_permission_assignment" drop column "scope";`);
  }

}
