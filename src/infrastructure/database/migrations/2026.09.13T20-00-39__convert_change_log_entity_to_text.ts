import { Migration } from '@mikro-orm/migrations';

export class Migration20260913200039_convert_change_log_entity_to_text extends Migration {

  override name = 'Migration20260913200039_convert_change_log_entity_to_text';

  override up(): void | Promise<void> {
    this.addSql(`alter table "system"."change_log" alter column "entity" type text using ("entity"::text);`);

    this.addSql(`alter table "system"."change_log" alter column "entity" type text using ("entity"::text);`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "system"."change_log" alter column "entity" type uuid using ("entity"::text::uuid);`);
  }

}
