import { Migration } from '@mikro-orm/migrations';

export class Migration20260212180037_update_audit_journal_structure extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "access_control"."audit_journal" drop constraint if exists "audit_journal_entity_check";`);

    this.addSql(`drop index "access_control"."audit_journal_entity_idx";`);
    this.addSql(`drop index "access_control"."audit_journal_realm_idx";`);
    this.addSql(`alter table "access_control"."audit_journal" drop column "entity_id", drop column "realm_id";`);

    this.addSql(`alter table "access_control"."audit_journal" add column "realm" uuid not null, add column "entity_type" text check ("entity_type" in ('PERMISSION_ASSIGNMENT', 'PERMISSION_OVERRIDE', 'DELEGATION_POLICY', 'ROLE_ASSIGNMENT', 'CONFLICT_MEMBER', 'CONFLICT_GROUP', 'PERMISSION', 'REALM', 'ROLE')) not null;`);
    this.addSql(`alter table "access_control"."audit_journal" alter column "entity" drop default;`);
    this.addSql(`alter table "access_control"."audit_journal" alter column "entity" type uuid using ("entity"::text::uuid);`);
    this.addSql(`alter table "access_control"."audit_journal" rename column "action" to "action_type";`);
    this.addSql(`create index "audit_journal_entity_idx" on "access_control"."audit_journal" ("entity_type", "entity");`);
    this.addSql(`create index "audit_journal_realm_idx" on "access_control"."audit_journal" ("realm");`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "access_control"."audit_journal" alter column "entity" type text using ("entity"::text);`);

    this.addSql(`drop index "access_control"."audit_journal_entity_idx";`);
    this.addSql(`drop index "access_control"."audit_journal_realm_idx";`);
    this.addSql(`alter table "access_control"."audit_journal" drop column "entity_type";`);

    this.addSql(`alter table "access_control"."audit_journal" add column "realm_id" uuid not null;`);
    this.addSql(`alter table "access_control"."audit_journal" alter column "entity" type text using ("entity"::text);`);
    this.addSql(`alter table "access_control"."audit_journal" add constraint "audit_journal_entity_check" check("entity" in ('PERMISSION_ASSIGNMENT', 'PERMISSION_OVERRIDE', 'DELEGATION_POLICY', 'ROLE_ASSIGNMENT', 'CONFLICT_MEMBER', 'CONFLICT_GROUP', 'PERMISSION', 'REALM', 'ROLE'));`);
    this.addSql(`alter table "access_control"."audit_journal" rename column "realm" to "entity_id";`);
    this.addSql(`alter table "access_control"."audit_journal" rename column "action_type" to "action";`);
    this.addSql(`create index "audit_journal_entity_idx" on "access_control"."audit_journal" ("entity", "entity_id");`);
    this.addSql(`create index "audit_journal_realm_idx" on "access_control"."audit_journal" ("realm_id");`);
  }

}
