import { Migration } from '@mikro-orm/migrations';

export class Migration20260203092856_change_enums extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "access_control"."audit_journal" drop constraint if exists "audit_journal_action_check";`);
    this.addSql(`alter table "access_control"."audit_journal" drop constraint if exists "audit_journal_entity_check";`);

    this.addSql(`alter table "access_control"."permission_override" drop constraint if exists "permission_override_effect_check";`);

    this.addSql(`alter table "access_control"."audit_journal" add constraint "audit_journal_action_check" check("action" in ('RESTORE', 'REVOKE', 'CREATE', 'UPDATE', 'DELETE'));`);
    this.addSql(`alter table "access_control"."audit_journal" add constraint "audit_journal_entity_check" check("entity" in ('PERMISSION_ASSIGNMENT', 'PERMISSION_OVERRIDE', 'DELEGATION_POLICY', 'ROLE_ASSIGNMENT', 'CONFLICT_MEMBER', 'CONFLICT_GROUP', 'PERMISSION', 'REALM', 'ROLE'));`);

    this.addSql(`alter table "access_control"."permission_override" add constraint "permission_override_effect_check" check("effect" in ('ALLOW', 'DENY'));`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "access_control"."audit_journal" drop constraint if exists "audit_journal_action_check";`);
    this.addSql(`alter table "access_control"."audit_journal" drop constraint if exists "audit_journal_entity_check";`);

    this.addSql(`alter table "access_control"."permission_override" drop constraint if exists "permission_override_effect_check";`);

    this.addSql(`alter table "access_control"."audit_journal" add constraint "audit_journal_action_check" check("action" in ('restore', 'revoke', 'create', 'update', 'delete'));`);
    this.addSql(`alter table "access_control"."audit_journal" add constraint "audit_journal_entity_check" check("entity" in ('permission_assignment', 'permission_override', 'delegation_policy', 'role_assignment', 'conflict_member', 'conflict_group', 'permission', 'realm', 'role'));`);

    this.addSql(`alter table "access_control"."permission_override" add constraint "permission_override_effect_check" check("effect" in ('allow', 'deny'));`);
  }

}
