import { Migration } from '@mikro-orm/migrations';

export class Migration20260603115322_refactor_outbox_schema extends Migration {

  override async up(): Promise<void> {
    this.addSql(`drop index "system"."outbox_aggregate_idx";`);
    this.addSql(`alter table "system"."outbox" drop column "event_type", drop column "aggregate_type";`);

    this.addSql(`alter table "system"."outbox" add column "action_type" varchar(64) not null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "system"."outbox" add column "aggregate_type" varchar(64) not null;`);
    this.addSql(`alter table "system"."outbox" rename column "action_type" to "event_type";`);
    this.addSql(`create index "outbox_aggregate_idx" on "system"."outbox" ("aggregate_type");`);
  }

}
