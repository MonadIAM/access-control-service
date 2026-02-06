import { Migration } from '@mikro-orm/migrations';

export class Migration20260206145115_install_pg_trgm_extension extends Migration {

  override async up(): Promise<void> {
    this.addSql(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);
  }

  override async down(): Promise<void> {
    this.addSql(`DROP EXTENSION IF EXISTS pg_trgm;`);
  }

}
