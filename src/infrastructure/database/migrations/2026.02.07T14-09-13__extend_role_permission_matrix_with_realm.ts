import { Migration } from '@mikro-orm/migrations';

export class Migration20260207140913_extend_role_permission_matrix_with_realm extends Migration {

  override async up(): Promise<void> {
    this.addSql(`drop index "access_control"."role_permission_matrix_permission_idx";`);
    this.addSql(`drop index "access_control"."role_permission_matrix_role_idx";`);

    this.addSql(`alter table "access_control"."role_permission_matrix" add column "realm_id" uuid not null;`);
    this.addSql(`alter table "access_control"."role_permission_matrix" add constraint "role_permission_matrix_realm_id_foreign" foreign key ("realm_id") references "access_control"."realm" ("id") on update cascade on delete cascade;`);
    this.addSql(`create index "role_permission_matrix_realm_permission_idx" on "access_control"."role_permission_matrix" ("realm_id", "permission_id");`);
    this.addSql(`create index "role_permission_matrix_realm_role_idx" on "access_control"."role_permission_matrix" ("realm_id", "role_id");`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "access_control"."role_permission_matrix" drop constraint "role_permission_matrix_realm_id_foreign";`);

    this.addSql(`drop index "access_control"."role_permission_matrix_realm_permission_idx";`);
    this.addSql(`drop index "access_control"."role_permission_matrix_realm_role_idx";`);
    this.addSql(`alter table "access_control"."role_permission_matrix" drop column "realm_id";`);

    this.addSql(`create index "role_permission_matrix_permission_idx" on "access_control"."role_permission_matrix" ("permission_id");`);
    this.addSql(`create index "role_permission_matrix_role_idx" on "access_control"."role_permission_matrix" ("role_id");`);
  }

}
