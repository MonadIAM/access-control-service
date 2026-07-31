import { Migration } from '@mikro-orm/migrations';

export class Migration20260731025741_convert_varchar_columns_to_text extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`alter table "access_control"."realm" alter column "code" type text using ("code"::text);`);
    this.addSql(`alter table "access_control"."realm" alter column "name" type text using ("name"::text);`);

    this.addSql(`alter table "access_control"."permission" alter column "code" type text using ("code"::text);`);
    this.addSql(`alter table "access_control"."permission" alter column "name" type text using ("name"::text);`);

    this.addSql(`alter table "access_control"."role" alter column "code" type text using ("code"::text);`);
    this.addSql(`alter table "access_control"."role" alter column "name" type text using ("name"::text);`);

    this.addSql(`alter table "access_control"."role_conflict_group" alter column "code" type text using ("code"::text);`);
    this.addSql(`alter table "access_control"."role_conflict_group" alter column "name" type text using ("name"::text);`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "access_control"."permission" alter column "code" type varchar(128) using ("code"::varchar(128));`);
    this.addSql(`alter table "access_control"."permission" alter column "name" type varchar(255) using ("name"::varchar(255));`);

    this.addSql(`alter table "access_control"."realm" alter column "code" type varchar(128) using ("code"::varchar(128));`);
    this.addSql(`alter table "access_control"."realm" alter column "name" type varchar(255) using ("name"::varchar(255));`);

    this.addSql(`alter table "access_control"."role" alter column "code" type varchar(128) using ("code"::varchar(128));`);
    this.addSql(`alter table "access_control"."role" alter column "name" type varchar(255) using ("name"::varchar(255));`);

    this.addSql(`alter table "access_control"."role_conflict_group" alter column "code" type varchar(128) using ("code"::varchar(128));`);
    this.addSql(`alter table "access_control"."role_conflict_group" alter column "name" type varchar(255) using ("name"::varchar(255));`);
  }

}
