import { Migration } from '@mikro-orm/migrations';

export class Migration20260207131625_add_trgm_idx_to_realm_name extends Migration {

  override async up(): Promise<void> {
    this.addSql(`CREATE INDEX "realm_name_trgm_idx" ON "access_control"."realm" USING gin ("name" gin_trgm_ops);`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index "access_control"."realm_name_trgm_idx";`);
  }

}
