import { Migration } from '@mikro-orm/migrations';

export class Migration20260814122244_make_audit_log_actor_nullable extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`alter table "system"."audit_log" alter column "actor" drop not null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "system"."audit_log" alter column "actor" set not null;`);
  }

}
