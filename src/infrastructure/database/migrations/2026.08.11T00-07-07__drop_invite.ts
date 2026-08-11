import { Migration } from '@mikro-orm/migrations';

export class Migration20260811000707_drop_invite extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`drop table if exists "access_control"."invite" cascade;`);

    this.addSql(`drop type "access_control"."invite_status";`);
  }

  override down(): void | Promise<void> {
    this.addSql(`create type "access_control"."invite_status" as enum ('CANCELLED', 'ACCEPTED', 'DECLINED', 'PENDING');`);
    this.addSql(`create table "access_control"."invite" ("created_at" timestamptz(3) not null, "id" uuid not null, "invitee" uuid not null, "inviter" uuid not null, "realm_id" uuid not null, "role_id" uuid not null, "status" "access_control"."invite_status" not null, "updated_at" timestamptz(3) null, "version" int not null default 1, primary key ("id"));`);
    this.addSql(`create index "invite_invitee_idx" on "access_control"."invite" ("invitee");`);
    this.addSql(`create index "invite_inviter_idx" on "access_control"."invite" ("inviter");`);
    this.addSql(`CREATE UNIQUE INDEX "invite_realm_invitee_role_pending_unique" ON "access_control"."invite" ("realm_id", "invitee", "role_id") WHERE "status" = 'PENDING';`);

    this.addSql(`alter table "access_control"."invite" add constraint "invite_realm_id_foreign" foreign key ("realm_id") references "access_control"."realm" ("id") on delete cascade;`);
    this.addSql(`alter table "access_control"."invite" add constraint "invite_role_id_foreign" foreign key ("role_id") references "access_control"."role" ("id") on delete cascade;`);
  }

}
