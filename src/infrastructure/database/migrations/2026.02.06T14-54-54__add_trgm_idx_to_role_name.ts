import { Migration } from '@mikro-orm/migrations';

export class Migration20260206145454_add_trgm_idx_to_role_name extends Migration {

  override async up(): Promise<void> {
    this.addSql(`CREATE INDEX "role_name_trgm_idx" ON "access_control"."role" USING gin ("name" gin_trgm_ops);`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index "access_control"."role_name_trgm_idx";`);
  }

}
