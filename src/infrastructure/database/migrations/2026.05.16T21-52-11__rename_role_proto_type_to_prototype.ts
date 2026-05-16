import { Migration } from '@mikro-orm/migrations';

export class Migration20260516215211_rename_role_proto_type_to_prototype extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "access_control"."role" rename column "proto_type" to "prototype";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "access_control"."role" rename column "prototype" to "proto_type";`);
  }

}
