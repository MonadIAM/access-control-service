import { Migration } from '@mikro-orm/migrations';

export class Migration20260526092934_implement_invite_table extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "access_control"."invite" ("id" uuid not null, "status" text check ("status" in ('CANCELLED', 'ACCEPTED', 'DECLINED', 'PENDING')) not null, "invitee" uuid not null, "inviter" uuid not null, "realm_id" uuid not null, "role_id" uuid not null, "updated_at" timestamptz(3) null, "created_at" timestamptz(3) not null, "version" int not null default 1, constraint "invite_pkey" primary key ("id"));`);
    this.addSql(`create index "invite_invitee_idx" on "access_control"."invite" ("invitee");`);
    this.addSql(`create index "invite_inviter_idx" on "access_control"."invite" ("inviter");`);
    this.addSql(`CREATE UNIQUE INDEX "invite_realm_invitee_role_pending_unique" ON "access_control"."invite" ("realm_id", "invitee", "role_id") WHERE "status" = 'PENDING';`);

    this.addSql(`alter table "access_control"."invite" add constraint "invite_realm_id_foreign" foreign key ("realm_id") references "access_control"."realm" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table "access_control"."invite" add constraint "invite_role_id_foreign" foreign key ("role_id") references "access_control"."role" ("id") on update cascade on delete cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "access_control"."invite" cascade;`);
  }

}
