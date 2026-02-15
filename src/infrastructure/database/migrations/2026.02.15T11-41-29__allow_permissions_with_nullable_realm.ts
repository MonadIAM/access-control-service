import { Migration } from '@mikro-orm/migrations';

export class Migration20260215114129_allow_permissions_with_nullable_realm extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "access_control"."permission" drop constraint "permission_realm_code_unique";`);
    this.addSql(`alter table "access_control"."permission" alter column "realm_id" drop default;`);
    this.addSql(`alter table "access_control"."permission" alter column "realm_id" type uuid using ("realm_id"::text::uuid);`);
    this.addSql(`alter table "access_control"."permission" alter column "realm_id" drop not null;`);
    this.addSql(`CREATE UNIQUE INDEX "permission_realm_code_unique" ON "access_control"."permission" ("realm_id", "code") WHERE "realm_id" IS NOT NULL;`);
    this.addSql(`CREATE UNIQUE INDEX "permission_global_code_unique" ON "access_control"."permission" ("code") WHERE "realm_id" IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index "access_control"."permission_realm_code_unique";`);
    this.addSql(`drop index "access_control"."permission_global_code_unique";`);
    this.addSql(`alter table "access_control"."permission" alter column "realm_id" drop default;`);
    this.addSql(`alter table "access_control"."permission" alter column "realm_id" type uuid using ("realm_id"::text::uuid);`);
    this.addSql(`alter table "access_control"."permission" alter column "realm_id" set not null;`);
    this.addSql(`alter table "access_control"."permission" add constraint "permission_realm_code_unique" unique ("realm_id", "code");`);
  }

}
