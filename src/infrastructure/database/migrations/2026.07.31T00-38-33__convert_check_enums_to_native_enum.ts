import { Migration } from '@mikro-orm/migrations';

export class Migration20260731003833_convert_check_enums_to_native_enum extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create type "access_control"."permission_override_effect" as enum ('ALLOW', 'DENY');`);
    this.addSql(`create type "access_control"."role_actor_type" as enum ('SERVICE', 'SYSTEM', 'HUMAN');`);
    this.addSql(`create type "access_control"."role_archetype" as enum ('COMPOSITE', 'ATOMIC');`);
    this.addSql(`create type "access_control"."invite_status" as enum ('CANCELLED', 'ACCEPTED', 'DECLINED', 'PENDING');`);
    this.addSql(`create type "access_control"."role_permission_assignment_scope" as enum ('REALM', 'GLOBAL');`);
    this.addSql(`alter table "access_control"."permission_override" drop constraint "permission_override_effect_check";`);
    this.addSql(`alter table "access_control"."permission_override" alter column "effect" type "access_control"."permission_override_effect" using ("effect"::"access_control"."permission_override_effect");`);

    this.addSql(`alter table "access_control"."role" drop constraint "role_actor_type_check";`);
    this.addSql(`alter table "access_control"."role" drop constraint "role_archetype_check";`);
    this.addSql(`alter table "access_control"."role" alter column "actor_type" type "access_control"."role_actor_type" using ("actor_type"::"access_control"."role_actor_type");`);
    this.addSql(`alter table "access_control"."role" alter column "archetype" type "access_control"."role_archetype" using ("archetype"::"access_control"."role_archetype");`);

    this.addSql(`alter table "access_control"."invite" drop constraint "invite_status_check";`);
    this.addSql(`drop index "access_control"."invite_realm_invitee_role_pending_unique";`);
    this.addSql(`alter table "access_control"."invite" alter column "status" type "access_control"."invite_status" using ("status"::"access_control"."invite_status");`);
    this.addSql(`CREATE UNIQUE INDEX "invite_realm_invitee_role_pending_unique" ON "access_control"."invite" ("realm_id", "invitee", "role_id") WHERE "status" = 'PENDING';`);

    this.addSql(`alter table "access_control"."role_permission_assignment" drop constraint "role_permission_assignment_scope_check";`);
    this.addSql(`alter table "access_control"."role_permission_assignment" alter column "scope" type "access_control"."role_permission_assignment_scope" using ("scope"::"access_control"."role_permission_assignment_scope");`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop index "access_control"."invite_realm_invitee_role_pending_unique";`);
    this.addSql(`alter table "access_control"."invite" alter column "status" type text using ("status"::text);`);
    this.addSql(`CREATE UNIQUE INDEX "invite_realm_invitee_role_pending_unique" ON "access_control"."invite" ("realm_id", "invitee", "role_id") WHERE "status" = 'PENDING';`);
    this.addSql(`alter table "access_control"."invite" add constraint "invite_status_check" check ("status" in ('CANCELLED', 'ACCEPTED', 'DECLINED', 'PENDING'));`);

    this.addSql(`alter table "access_control"."permission_override" alter column "effect" type text using ("effect"::text);`);
    this.addSql(`alter table "access_control"."permission_override" add constraint "permission_override_effect_check" check ("effect" in ('ALLOW', 'DENY'));`);

    this.addSql(`alter table "access_control"."role" alter column "actor_type" type text using ("actor_type"::text);`);
    this.addSql(`alter table "access_control"."role" alter column "archetype" type text using ("archetype"::text);`);
    this.addSql(`alter table "access_control"."role" add constraint "role_actor_type_check" check ("actor_type" in ('SERVICE', 'SYSTEM', 'HUMAN'));`);
    this.addSql(`alter table "access_control"."role" add constraint "role_archetype_check" check ("archetype" in ('COMPOSITE', 'ATOMIC'));`);

    this.addSql(`alter table "access_control"."role_permission_assignment" alter column "scope" type text using ("scope"::text);`);
    this.addSql(`alter table "access_control"."role_permission_assignment" add constraint "role_permission_assignment_scope_check" check ("scope" in ('REALM', 'GLOBAL'));`);

    this.addSql(`drop type "access_control"."permission_override_effect";`);
    this.addSql(`drop type "access_control"."role_actor_type";`);
    this.addSql(`drop type "access_control"."role_archetype";`);
    this.addSql(`drop type "access_control"."invite_status";`);
    this.addSql(`drop type "access_control"."role_permission_assignment_scope";`);
  }

}
