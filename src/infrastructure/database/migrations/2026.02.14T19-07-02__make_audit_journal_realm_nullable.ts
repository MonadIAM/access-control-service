import { Migration } from '@mikro-orm/migrations';

export class Migration20260214190702_make_audit_journal_realm_nullable extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "access_control"."audit_journal" alter column "realm" drop default;`);
    this.addSql(`alter table "access_control"."audit_journal" alter column "realm" type uuid using ("realm"::text::uuid);`);
    this.addSql(`alter table "access_control"."audit_journal" alter column "realm" drop not null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "access_control"."audit_journal" alter column "realm" drop default;`);
    this.addSql(`alter table "access_control"."audit_journal" alter column "realm" type uuid using ("realm"::text::uuid);`);
    this.addSql(`alter table "access_control"."audit_journal" alter column "realm" set not null;`);
  }

}
