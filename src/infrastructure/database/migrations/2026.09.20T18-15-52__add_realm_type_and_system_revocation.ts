import { Migration } from '@mikro-orm/migrations';

export class Migration20260920181552_add_realm_type_and_system_revocation extends Migration {

  override name = 'Migration20260920181552_add_realm_type_and_system_revocation';

  override up(): void | Promise<void> {
    this.addSql(`create type "access_control"."realm_type" as enum ('SYSTEM', 'ORGANIZATION', 'PROJECT');`);
    this.addSql(`alter table "access_control"."realm" add "type" "access_control"."realm_type" not null, add "is_system_revoked" boolean not null default false;`);

    this.addSql(`alter table "access_control"."permission_override" add "is_system_revoked" boolean not null default false;`);

    this.addSql(`alter table "access_control"."account_role_assignment" add "is_system_revoked" boolean not null default false;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "access_control"."account_role_assignment" drop column "is_system_revoked";`);

    this.addSql(`alter table "access_control"."permission_override" drop column "is_system_revoked";`);

    this.addSql(`alter table "access_control"."realm" drop column "type", drop column "is_system_revoked";`);

    this.addSql(`drop type "access_control"."realm_type";`);
  }

}
