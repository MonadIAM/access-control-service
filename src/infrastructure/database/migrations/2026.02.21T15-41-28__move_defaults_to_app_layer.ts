import { Migration } from '@mikro-orm/migrations';

export class Migration20260221154128_move_defaults_to_app_layer extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "access_control"."audit_journal" alter column "id" drop default;`);
    this.addSql(`alter table "access_control"."audit_journal" alter column "id" drop default;`);
    this.addSql(`alter table "access_control"."audit_journal" alter column "id" type uuid using ("id"::text::uuid);`);
    this.addSql(`alter table "access_control"."audit_journal" alter column "created_at" drop default;`);
    this.addSql(`alter table "access_control"."audit_journal" alter column "created_at" type timestamptz(3) using ("created_at"::timestamptz(3));`);

    this.addSql(`alter table "access_control"."realm" alter column "id" drop default;`);
    this.addSql(`alter table "access_control"."realm" alter column "id" drop default;`);
    this.addSql(`alter table "access_control"."realm" alter column "id" type uuid using ("id"::text::uuid);`);
    this.addSql(`alter table "access_control"."realm" alter column "is_system_managed" drop default;`);
    this.addSql(`alter table "access_control"."realm" alter column "is_system_managed" type boolean using ("is_system_managed"::boolean);`);
    this.addSql(`alter table "access_control"."realm" alter column "created_at" drop default;`);
    this.addSql(`alter table "access_control"."realm" alter column "created_at" type timestamptz(3) using ("created_at"::timestamptz(3));`);
    this.addSql(`alter table "access_control"."realm" alter column "last_actions" drop default;`);
    this.addSql(`alter table "access_control"."realm" alter column "last_actions" type jsonb using ("last_actions"::jsonb);`);
    this.addSql(`alter table "access_control"."realm" alter column "is_revoked" drop default;`);
    this.addSql(`alter table "access_control"."realm" alter column "is_revoked" type boolean using ("is_revoked"::boolean);`);

    this.addSql(`alter table "access_control"."permission" alter column "id" drop default;`);
    this.addSql(`alter table "access_control"."permission" alter column "id" drop default;`);
    this.addSql(`alter table "access_control"."permission" alter column "id" type uuid using ("id"::text::uuid);`);
    this.addSql(`alter table "access_control"."permission" alter column "is_system_managed" drop default;`);
    this.addSql(`alter table "access_control"."permission" alter column "is_system_managed" type boolean using ("is_system_managed"::boolean);`);
    this.addSql(`alter table "access_control"."permission" alter column "created_at" drop default;`);
    this.addSql(`alter table "access_control"."permission" alter column "created_at" type timestamptz(3) using ("created_at"::timestamptz(3));`);
    this.addSql(`alter table "access_control"."permission" alter column "last_actions" drop default;`);
    this.addSql(`alter table "access_control"."permission" alter column "last_actions" type jsonb using ("last_actions"::jsonb);`);
    this.addSql(`alter table "access_control"."permission" alter column "is_revoked" drop default;`);
    this.addSql(`alter table "access_control"."permission" alter column "is_revoked" type boolean using ("is_revoked"::boolean);`);

    this.addSql(`alter table "access_control"."permission_override" alter column "id" drop default;`);
    this.addSql(`alter table "access_control"."permission_override" alter column "id" drop default;`);
    this.addSql(`alter table "access_control"."permission_override" alter column "id" type uuid using ("id"::text::uuid);`);
    this.addSql(`alter table "access_control"."permission_override" alter column "created_at" drop default;`);
    this.addSql(`alter table "access_control"."permission_override" alter column "created_at" type timestamptz(3) using ("created_at"::timestamptz(3));`);
    this.addSql(`alter table "access_control"."permission_override" alter column "last_actions" drop default;`);
    this.addSql(`alter table "access_control"."permission_override" alter column "last_actions" type jsonb using ("last_actions"::jsonb);`);
    this.addSql(`alter table "access_control"."permission_override" alter column "is_revoked" drop default;`);
    this.addSql(`alter table "access_control"."permission_override" alter column "is_revoked" type boolean using ("is_revoked"::boolean);`);

    this.addSql(`alter table "access_control"."role" alter column "id" drop default;`);
    this.addSql(`alter table "access_control"."role" alter column "id" drop default;`);
    this.addSql(`alter table "access_control"."role" alter column "id" type uuid using ("id"::text::uuid);`);
    this.addSql(`alter table "access_control"."role" alter column "is_system_managed" drop default;`);
    this.addSql(`alter table "access_control"."role" alter column "is_system_managed" type boolean using ("is_system_managed"::boolean);`);
    this.addSql(`alter table "access_control"."role" alter column "non_delegable" drop default;`);
    this.addSql(`alter table "access_control"."role" alter column "non_delegable" type boolean using ("non_delegable"::boolean);`);
    this.addSql(`alter table "access_control"."role" alter column "created_at" drop default;`);
    this.addSql(`alter table "access_control"."role" alter column "created_at" type timestamptz(3) using ("created_at"::timestamptz(3));`);
    this.addSql(`alter table "access_control"."role" alter column "last_actions" drop default;`);
    this.addSql(`alter table "access_control"."role" alter column "last_actions" type jsonb using ("last_actions"::jsonb);`);
    this.addSql(`alter table "access_control"."role" alter column "is_revoked" drop default;`);
    this.addSql(`alter table "access_control"."role" alter column "is_revoked" type boolean using ("is_revoked"::boolean);`);

    this.addSql(`alter table "access_control"."account_role_assignment" alter column "id" drop default;`);
    this.addSql(`alter table "access_control"."account_role_assignment" alter column "id" drop default;`);
    this.addSql(`alter table "access_control"."account_role_assignment" alter column "id" type uuid using ("id"::text::uuid);`);
    this.addSql(`alter table "access_control"."account_role_assignment" alter column "is_system_managed" drop default;`);
    this.addSql(`alter table "access_control"."account_role_assignment" alter column "is_system_managed" type boolean using ("is_system_managed"::boolean);`);
    this.addSql(`alter table "access_control"."account_role_assignment" alter column "created_at" drop default;`);
    this.addSql(`alter table "access_control"."account_role_assignment" alter column "created_at" type timestamptz(3) using ("created_at"::timestamptz(3));`);
    this.addSql(`alter table "access_control"."account_role_assignment" alter column "last_actions" drop default;`);
    this.addSql(`alter table "access_control"."account_role_assignment" alter column "last_actions" type jsonb using ("last_actions"::jsonb);`);
    this.addSql(`alter table "access_control"."account_role_assignment" alter column "is_revoked" drop default;`);
    this.addSql(`alter table "access_control"."account_role_assignment" alter column "is_revoked" type boolean using ("is_revoked"::boolean);`);

    this.addSql(`alter table "access_control"."role_conflict_group" alter column "id" drop default;`);
    this.addSql(`alter table "access_control"."role_conflict_group" alter column "id" drop default;`);
    this.addSql(`alter table "access_control"."role_conflict_group" alter column "id" type uuid using ("id"::text::uuid);`);
    this.addSql(`alter table "access_control"."role_conflict_group" alter column "is_system_managed" drop default;`);
    this.addSql(`alter table "access_control"."role_conflict_group" alter column "is_system_managed" type boolean using ("is_system_managed"::boolean);`);
    this.addSql(`alter table "access_control"."role_conflict_group" alter column "max_allowed" drop default;`);
    this.addSql(`alter table "access_control"."role_conflict_group" alter column "max_allowed" type int using ("max_allowed"::int);`);
    this.addSql(`alter table "access_control"."role_conflict_group" alter column "created_at" drop default;`);
    this.addSql(`alter table "access_control"."role_conflict_group" alter column "created_at" type timestamptz(3) using ("created_at"::timestamptz(3));`);
    this.addSql(`alter table "access_control"."role_conflict_group" alter column "last_actions" drop default;`);
    this.addSql(`alter table "access_control"."role_conflict_group" alter column "last_actions" type jsonb using ("last_actions"::jsonb);`);
    this.addSql(`alter table "access_control"."role_conflict_group" alter column "is_revoked" drop default;`);
    this.addSql(`alter table "access_control"."role_conflict_group" alter column "is_revoked" type boolean using ("is_revoked"::boolean);`);

    this.addSql(`alter table "access_control"."role_conflict_member" alter column "id" drop default;`);
    this.addSql(`alter table "access_control"."role_conflict_member" alter column "id" drop default;`);
    this.addSql(`alter table "access_control"."role_conflict_member" alter column "id" type uuid using ("id"::text::uuid);`);
    this.addSql(`alter table "access_control"."role_conflict_member" alter column "is_system_managed" drop default;`);
    this.addSql(`alter table "access_control"."role_conflict_member" alter column "is_system_managed" type boolean using ("is_system_managed"::boolean);`);
    this.addSql(`alter table "access_control"."role_conflict_member" alter column "created_at" drop default;`);
    this.addSql(`alter table "access_control"."role_conflict_member" alter column "created_at" type timestamptz(3) using ("created_at"::timestamptz(3));`);
    this.addSql(`alter table "access_control"."role_conflict_member" alter column "last_actions" drop default;`);
    this.addSql(`alter table "access_control"."role_conflict_member" alter column "last_actions" type jsonb using ("last_actions"::jsonb);`);
    this.addSql(`alter table "access_control"."role_conflict_member" alter column "is_revoked" drop default;`);
    this.addSql(`alter table "access_control"."role_conflict_member" alter column "is_revoked" type boolean using ("is_revoked"::boolean);`);

    this.addSql(`alter table "access_control"."role_delegation_policy" alter column "id" drop default;`);
    this.addSql(`alter table "access_control"."role_delegation_policy" alter column "id" drop default;`);
    this.addSql(`alter table "access_control"."role_delegation_policy" alter column "id" type uuid using ("id"::text::uuid);`);
    this.addSql(`alter table "access_control"."role_delegation_policy" alter column "is_system_managed" drop default;`);
    this.addSql(`alter table "access_control"."role_delegation_policy" alter column "is_system_managed" type boolean using ("is_system_managed"::boolean);`);
    this.addSql(`alter table "access_control"."role_delegation_policy" alter column "depth_limit" drop default;`);
    this.addSql(`alter table "access_control"."role_delegation_policy" alter column "depth_limit" type smallint using ("depth_limit"::smallint);`);
    this.addSql(`alter table "access_control"."role_delegation_policy" alter column "created_at" drop default;`);
    this.addSql(`alter table "access_control"."role_delegation_policy" alter column "created_at" type timestamptz(3) using ("created_at"::timestamptz(3));`);
    this.addSql(`alter table "access_control"."role_delegation_policy" alter column "last_actions" drop default;`);
    this.addSql(`alter table "access_control"."role_delegation_policy" alter column "last_actions" type jsonb using ("last_actions"::jsonb);`);
    this.addSql(`alter table "access_control"."role_delegation_policy" alter column "is_revoked" drop default;`);
    this.addSql(`alter table "access_control"."role_delegation_policy" alter column "is_revoked" type boolean using ("is_revoked"::boolean);`);

    this.addSql(`alter table "access_control"."role_permission_assignment" alter column "id" drop default;`);
    this.addSql(`alter table "access_control"."role_permission_assignment" alter column "id" drop default;`);
    this.addSql(`alter table "access_control"."role_permission_assignment" alter column "id" type uuid using ("id"::text::uuid);`);
    this.addSql(`alter table "access_control"."role_permission_assignment" alter column "is_system_managed" drop default;`);
    this.addSql(`alter table "access_control"."role_permission_assignment" alter column "is_system_managed" type boolean using ("is_system_managed"::boolean);`);
    this.addSql(`alter table "access_control"."role_permission_assignment" alter column "created_at" drop default;`);
    this.addSql(`alter table "access_control"."role_permission_assignment" alter column "created_at" type timestamptz(3) using ("created_at"::timestamptz(3));`);
    this.addSql(`alter table "access_control"."role_permission_assignment" alter column "last_actions" drop default;`);
    this.addSql(`alter table "access_control"."role_permission_assignment" alter column "last_actions" type jsonb using ("last_actions"::jsonb);`);
    this.addSql(`alter table "access_control"."role_permission_assignment" alter column "is_revoked" drop default;`);
    this.addSql(`alter table "access_control"."role_permission_assignment" alter column "is_revoked" type boolean using ("is_revoked"::boolean);`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "access_control"."audit_journal" alter column "id" drop default;`);
    this.addSql(`alter table "access_control"."audit_journal" alter column "id" type uuid using ("id"::text::uuid);`);
    this.addSql(`alter table "access_control"."audit_journal" alter column "id" set default gen_random_uuid();`);
    this.addSql(`alter table "access_control"."audit_journal" alter column "created_at" type timestamptz(3) using ("created_at"::timestamptz(3));`);
    this.addSql(`alter table "access_control"."audit_journal" alter column "created_at" set default now();`);

    this.addSql(`alter table "access_control"."realm" alter column "id" drop default;`);
    this.addSql(`alter table "access_control"."realm" alter column "id" type uuid using ("id"::text::uuid);`);
    this.addSql(`alter table "access_control"."realm" alter column "id" set default gen_random_uuid();`);
    this.addSql(`alter table "access_control"."realm" alter column "is_system_managed" type boolean using ("is_system_managed"::boolean);`);
    this.addSql(`alter table "access_control"."realm" alter column "is_system_managed" set default false;`);
    this.addSql(`alter table "access_control"."realm" alter column "created_at" type timestamptz(3) using ("created_at"::timestamptz(3));`);
    this.addSql(`alter table "access_control"."realm" alter column "created_at" set default now();`);
    this.addSql(`alter table "access_control"."realm" alter column "last_actions" type jsonb using ("last_actions"::jsonb);`);
    this.addSql(`alter table "access_control"."realm" alter column "last_actions" set default '{}';`);
    this.addSql(`alter table "access_control"."realm" alter column "is_revoked" type boolean using ("is_revoked"::boolean);`);
    this.addSql(`alter table "access_control"."realm" alter column "is_revoked" set default false;`);

    this.addSql(`alter table "access_control"."permission" alter column "id" drop default;`);
    this.addSql(`alter table "access_control"."permission" alter column "id" type uuid using ("id"::text::uuid);`);
    this.addSql(`alter table "access_control"."permission" alter column "id" set default gen_random_uuid();`);
    this.addSql(`alter table "access_control"."permission" alter column "is_system_managed" type boolean using ("is_system_managed"::boolean);`);
    this.addSql(`alter table "access_control"."permission" alter column "is_system_managed" set default false;`);
    this.addSql(`alter table "access_control"."permission" alter column "created_at" type timestamptz(3) using ("created_at"::timestamptz(3));`);
    this.addSql(`alter table "access_control"."permission" alter column "created_at" set default now();`);
    this.addSql(`alter table "access_control"."permission" alter column "last_actions" type jsonb using ("last_actions"::jsonb);`);
    this.addSql(`alter table "access_control"."permission" alter column "last_actions" set default '{}';`);
    this.addSql(`alter table "access_control"."permission" alter column "is_revoked" type boolean using ("is_revoked"::boolean);`);
    this.addSql(`alter table "access_control"."permission" alter column "is_revoked" set default false;`);

    this.addSql(`alter table "access_control"."permission_override" alter column "id" drop default;`);
    this.addSql(`alter table "access_control"."permission_override" alter column "id" type uuid using ("id"::text::uuid);`);
    this.addSql(`alter table "access_control"."permission_override" alter column "id" set default gen_random_uuid();`);
    this.addSql(`alter table "access_control"."permission_override" alter column "created_at" type timestamptz(3) using ("created_at"::timestamptz(3));`);
    this.addSql(`alter table "access_control"."permission_override" alter column "created_at" set default now();`);
    this.addSql(`alter table "access_control"."permission_override" alter column "last_actions" type jsonb using ("last_actions"::jsonb);`);
    this.addSql(`alter table "access_control"."permission_override" alter column "last_actions" set default '{}';`);
    this.addSql(`alter table "access_control"."permission_override" alter column "is_revoked" type boolean using ("is_revoked"::boolean);`);
    this.addSql(`alter table "access_control"."permission_override" alter column "is_revoked" set default false;`);

    this.addSql(`alter table "access_control"."role" alter column "id" drop default;`);
    this.addSql(`alter table "access_control"."role" alter column "id" type uuid using ("id"::text::uuid);`);
    this.addSql(`alter table "access_control"."role" alter column "id" set default gen_random_uuid();`);
    this.addSql(`alter table "access_control"."role" alter column "is_system_managed" type boolean using ("is_system_managed"::boolean);`);
    this.addSql(`alter table "access_control"."role" alter column "is_system_managed" set default false;`);
    this.addSql(`alter table "access_control"."role" alter column "non_delegable" type boolean using ("non_delegable"::boolean);`);
    this.addSql(`alter table "access_control"."role" alter column "non_delegable" set default false;`);
    this.addSql(`alter table "access_control"."role" alter column "created_at" type timestamptz(3) using ("created_at"::timestamptz(3));`);
    this.addSql(`alter table "access_control"."role" alter column "created_at" set default now();`);
    this.addSql(`alter table "access_control"."role" alter column "last_actions" type jsonb using ("last_actions"::jsonb);`);
    this.addSql(`alter table "access_control"."role" alter column "last_actions" set default '{}';`);
    this.addSql(`alter table "access_control"."role" alter column "is_revoked" type boolean using ("is_revoked"::boolean);`);
    this.addSql(`alter table "access_control"."role" alter column "is_revoked" set default false;`);

    this.addSql(`alter table "access_control"."account_role_assignment" alter column "id" drop default;`);
    this.addSql(`alter table "access_control"."account_role_assignment" alter column "id" type uuid using ("id"::text::uuid);`);
    this.addSql(`alter table "access_control"."account_role_assignment" alter column "id" set default gen_random_uuid();`);
    this.addSql(`alter table "access_control"."account_role_assignment" alter column "is_system_managed" type boolean using ("is_system_managed"::boolean);`);
    this.addSql(`alter table "access_control"."account_role_assignment" alter column "is_system_managed" set default false;`);
    this.addSql(`alter table "access_control"."account_role_assignment" alter column "created_at" type timestamptz(3) using ("created_at"::timestamptz(3));`);
    this.addSql(`alter table "access_control"."account_role_assignment" alter column "created_at" set default now();`);
    this.addSql(`alter table "access_control"."account_role_assignment" alter column "last_actions" type jsonb using ("last_actions"::jsonb);`);
    this.addSql(`alter table "access_control"."account_role_assignment" alter column "last_actions" set default '{}';`);
    this.addSql(`alter table "access_control"."account_role_assignment" alter column "is_revoked" type boolean using ("is_revoked"::boolean);`);
    this.addSql(`alter table "access_control"."account_role_assignment" alter column "is_revoked" set default false;`);

    this.addSql(`alter table "access_control"."role_conflict_group" alter column "id" drop default;`);
    this.addSql(`alter table "access_control"."role_conflict_group" alter column "id" type uuid using ("id"::text::uuid);`);
    this.addSql(`alter table "access_control"."role_conflict_group" alter column "id" set default gen_random_uuid();`);
    this.addSql(`alter table "access_control"."role_conflict_group" alter column "is_system_managed" type boolean using ("is_system_managed"::boolean);`);
    this.addSql(`alter table "access_control"."role_conflict_group" alter column "is_system_managed" set default false;`);
    this.addSql(`alter table "access_control"."role_conflict_group" alter column "max_allowed" type int using ("max_allowed"::int);`);
    this.addSql(`alter table "access_control"."role_conflict_group" alter column "max_allowed" set default 1;`);
    this.addSql(`alter table "access_control"."role_conflict_group" alter column "created_at" type timestamptz(3) using ("created_at"::timestamptz(3));`);
    this.addSql(`alter table "access_control"."role_conflict_group" alter column "created_at" set default now();`);
    this.addSql(`alter table "access_control"."role_conflict_group" alter column "last_actions" type jsonb using ("last_actions"::jsonb);`);
    this.addSql(`alter table "access_control"."role_conflict_group" alter column "last_actions" set default '{}';`);
    this.addSql(`alter table "access_control"."role_conflict_group" alter column "is_revoked" type boolean using ("is_revoked"::boolean);`);
    this.addSql(`alter table "access_control"."role_conflict_group" alter column "is_revoked" set default false;`);

    this.addSql(`alter table "access_control"."role_conflict_member" alter column "id" drop default;`);
    this.addSql(`alter table "access_control"."role_conflict_member" alter column "id" type uuid using ("id"::text::uuid);`);
    this.addSql(`alter table "access_control"."role_conflict_member" alter column "id" set default gen_random_uuid();`);
    this.addSql(`alter table "access_control"."role_conflict_member" alter column "is_system_managed" type boolean using ("is_system_managed"::boolean);`);
    this.addSql(`alter table "access_control"."role_conflict_member" alter column "is_system_managed" set default false;`);
    this.addSql(`alter table "access_control"."role_conflict_member" alter column "created_at" type timestamptz(3) using ("created_at"::timestamptz(3));`);
    this.addSql(`alter table "access_control"."role_conflict_member" alter column "created_at" set default now();`);
    this.addSql(`alter table "access_control"."role_conflict_member" alter column "last_actions" type jsonb using ("last_actions"::jsonb);`);
    this.addSql(`alter table "access_control"."role_conflict_member" alter column "last_actions" set default '{}';`);
    this.addSql(`alter table "access_control"."role_conflict_member" alter column "is_revoked" type boolean using ("is_revoked"::boolean);`);
    this.addSql(`alter table "access_control"."role_conflict_member" alter column "is_revoked" set default false;`);

    this.addSql(`alter table "access_control"."role_delegation_policy" alter column "id" drop default;`);
    this.addSql(`alter table "access_control"."role_delegation_policy" alter column "id" type uuid using ("id"::text::uuid);`);
    this.addSql(`alter table "access_control"."role_delegation_policy" alter column "id" set default gen_random_uuid();`);
    this.addSql(`alter table "access_control"."role_delegation_policy" alter column "is_system_managed" type boolean using ("is_system_managed"::boolean);`);
    this.addSql(`alter table "access_control"."role_delegation_policy" alter column "is_system_managed" set default false;`);
    this.addSql(`alter table "access_control"."role_delegation_policy" alter column "depth_limit" type smallint using ("depth_limit"::smallint);`);
    this.addSql(`alter table "access_control"."role_delegation_policy" alter column "depth_limit" set default 0;`);
    this.addSql(`alter table "access_control"."role_delegation_policy" alter column "created_at" type timestamptz(3) using ("created_at"::timestamptz(3));`);
    this.addSql(`alter table "access_control"."role_delegation_policy" alter column "created_at" set default now();`);
    this.addSql(`alter table "access_control"."role_delegation_policy" alter column "last_actions" type jsonb using ("last_actions"::jsonb);`);
    this.addSql(`alter table "access_control"."role_delegation_policy" alter column "last_actions" set default '{}';`);
    this.addSql(`alter table "access_control"."role_delegation_policy" alter column "is_revoked" type boolean using ("is_revoked"::boolean);`);
    this.addSql(`alter table "access_control"."role_delegation_policy" alter column "is_revoked" set default false;`);

    this.addSql(`alter table "access_control"."role_permission_assignment" alter column "id" drop default;`);
    this.addSql(`alter table "access_control"."role_permission_assignment" alter column "id" type uuid using ("id"::text::uuid);`);
    this.addSql(`alter table "access_control"."role_permission_assignment" alter column "id" set default gen_random_uuid();`);
    this.addSql(`alter table "access_control"."role_permission_assignment" alter column "is_system_managed" type boolean using ("is_system_managed"::boolean);`);
    this.addSql(`alter table "access_control"."role_permission_assignment" alter column "is_system_managed" set default false;`);
    this.addSql(`alter table "access_control"."role_permission_assignment" alter column "created_at" type timestamptz(3) using ("created_at"::timestamptz(3));`);
    this.addSql(`alter table "access_control"."role_permission_assignment" alter column "created_at" set default now();`);
    this.addSql(`alter table "access_control"."role_permission_assignment" alter column "last_actions" type jsonb using ("last_actions"::jsonb);`);
    this.addSql(`alter table "access_control"."role_permission_assignment" alter column "last_actions" set default '{}';`);
    this.addSql(`alter table "access_control"."role_permission_assignment" alter column "is_revoked" type boolean using ("is_revoked"::boolean);`);
    this.addSql(`alter table "access_control"."role_permission_assignment" alter column "is_revoked" set default false;`);
  }

}
