import { Migration } from '@mikro-orm/migrations';

export class Migration20260425053620_remove_ttl_expires_at_from_outbox extends Migration {

  override async up(): Promise<void> {
    this.addSql(`drop index "system"."outbox_ttl_expires_at_idx";`);
    this.addSql(`alter table "system"."outbox" drop column "ttl_expires_at";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "system"."outbox" add column "ttl_expires_at" timestamptz(3) null;`);
    this.addSql(`create index "outbox_ttl_expires_at_idx" on "system"."outbox" ("ttl_expires_at");`);
  }

}
