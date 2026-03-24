import { Migration } from '@mikro-orm/migrations';

export class Migration20260324115048_update_audit_schema extends Migration {

  override async up(): Promise<void> {
    this.addSql(`drop index "access_control"."audit_journal_entity_idx";`);
    this.addSql(`drop index "access_control"."audit_journal_by_at_idx";`);
    this.addSql(`alter table "access_control"."audit_journal" drop column "entity", drop column "by", drop column "at", drop column "reason";`);

    this.addSql(`alter table "access_control"."audit_journal" add column "actor" uuid not null;`);
    this.addSql(`alter table "access_control"."audit_journal" rename column "patch" to "input";`);
    this.addSql(`create index "audit_journal_actor_created_at_idx" on "access_control"."audit_journal" ("actor", "created_at");`);
    this.addSql(`create index "audit_journal_entity_type_action_idx" on "access_control"."audit_journal" ("entity_type", "action_type");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index "access_control"."audit_journal_actor_created_at_idx";`);
    this.addSql(`drop index "access_control"."audit_journal_entity_type_action_idx";`);

    this.addSql(`alter table "access_control"."audit_journal" add column "by" uuid not null, add column "at" timestamptz(3) not null, add column "reason" text null;`);
    this.addSql(`alter table "access_control"."audit_journal" rename column "actor" to "entity";`);
    this.addSql(`alter table "access_control"."audit_journal" rename column "input" to "patch";`);
    this.addSql(`create index "audit_journal_entity_idx" on "access_control"."audit_journal" ("entity_type", "entity");`);
    this.addSql(`create index "audit_journal_by_at_idx" on "access_control"."audit_journal" ("by", "at");`);
  }

}
