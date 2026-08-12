import { Migration } from '@mikro-orm/migrations';

export class Migration20260812011139_drop_role_non_delegable extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`alter table "access_control"."role" drop column "non_delegable";`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "access_control"."role" add "non_delegable" boolean not null;`);
  }

}
