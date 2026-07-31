import { Migration } from '@mikro-orm/migrations';

export class Migration20260731005359_convert_audit_log_ip_to_inet extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`alter table "system"."audit_log" alter column "ip" type inet using ("ip"::inet);`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "system"."audit_log" alter column "ip" type varchar(45) using ("ip"::varchar(45));`);
  }

}
