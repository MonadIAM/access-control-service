import { Migration } from '@mikro-orm/migrations';

export class Migration20260226225814_make_permission_realm_required extends Migration {

  override async up(): Promise<void> {
    this.addSql(`drop index "access_control"."permission_global_code_unique";`);

    this.addSql(`alter table "access_control"."permission" alter column "realm_id" drop default;`);
    this.addSql(`alter table "access_control"."permission" alter column "realm_id" type uuid using ("realm_id"::text::uuid);`);
    this.addSql(`alter table "access_control"."permission" alter column "realm_id" set not null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "access_control"."permission" alter column "realm_id" drop default;`);
    this.addSql(`alter table "access_control"."permission" alter column "realm_id" type uuid using ("realm_id"::text::uuid);`);
    this.addSql(`alter table "access_control"."permission" alter column "realm_id" drop not null;`);
    this.addSql(`CREATE UNIQUE INDEX "permission_global_code_unique" ON "access_control"."permission" ("code") WHERE "realm_id" IS NULL;`);
  }

}
