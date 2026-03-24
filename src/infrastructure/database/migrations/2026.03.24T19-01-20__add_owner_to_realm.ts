import { Migration } from '@mikro-orm/migrations';

export class Migration20260324190120_add_owner_to_realm extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "access_control"."realm" add column "owner" uuid not null;`);
    this.addSql(`create index "realm_owner_idx" on "access_control"."realm" ("owner");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index "access_control"."realm_owner_idx";`);
    this.addSql(`alter table "access_control"."realm" drop column "owner";`);
  }

}
