import { Migration } from '@mikro-orm/migrations';

export class Migration20260914163931_add_inbox extends Migration {

  override name = 'Migration20260914163931_add_inbox';

  override up(): void | Promise<void> {
    this.addSql(`create table "system"."inbox" ("consumer_key" text not null, "event" text not null, "partition" int null, "offset" text null, "topic" text null, "processed_at" timestamptz(3) not null, primary key ("consumer_key", "event"));`);
    this.addSql(`create index "inbox_processed_at_idx" on "system"."inbox" ("processed_at");`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "system"."inbox" cascade;`);
  }

}
