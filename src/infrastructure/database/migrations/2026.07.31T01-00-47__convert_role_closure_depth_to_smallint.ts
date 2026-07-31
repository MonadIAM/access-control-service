import { Migration } from '@mikro-orm/migrations';

export class Migration20260731010047_convert_role_closure_depth_to_smallint extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`alter table "access_control"."role_closure" alter column "depth" type smallint using ("depth"::smallint);`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "access_control"."role_closure" alter column "depth" type int using ("depth"::int);`);
  }

}
