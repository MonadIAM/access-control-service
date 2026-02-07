import { Migration } from '@mikro-orm/migrations';

export class Migration20260207103958_add_trgm_idx_to_permission_name extends Migration {

  override async up(): Promise<void> {
    this.addSql(`CREATE INDEX "permission_name_trgm_idx" ON "access_control"."permission" USING gin ("name" gin_trgm_ops);`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index "access_control"."permission_name_trgm_idx";`);
  }

}
