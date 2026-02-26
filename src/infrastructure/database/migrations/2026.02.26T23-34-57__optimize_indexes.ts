import { Migration } from '@mikro-orm/migrations';

export class Migration20260226233457_optimize_indexes extends Migration {

  override async up(): Promise<void> {
    this.addSql(`drop index "access_control"."permission_override_realm_account_idx";`);
    this.addSql(`drop index "access_control"."permission_override_realm_permission_idx";`);

    this.addSql(`create index "permission_override_account_idx" on "access_control"."permission_override" ("account");`);
    this.addSql(`create index "permission_override_permission_idx" on "access_control"."permission_override" ("permission_id");`);

    this.addSql(`drop index "access_control"."account_role_assignment_realm_account_idx";`);
    this.addSql(`drop index "access_control"."account_role_assignment_realm_role_idx";`);

    this.addSql(`create index "account_role_assignment_account_idx" on "access_control"."account_role_assignment" ("account");`);
    this.addSql(`create index "account_role_assignment_role_idx" on "access_control"."account_role_assignment" ("role_id");`);

    this.addSql(`drop index "access_control"."role_closure_realm_ancestor_idx";`);
    this.addSql(`drop index "access_control"."role_closure_realm_descendant_idx";`);

    this.addSql(`create index "role_closure_ancestor_depth_idx" on "access_control"."role_closure" ("ancestor_id", "depth");`);
    this.addSql(`create index "role_closure_descendant_depth_idx" on "access_control"."role_closure" ("descendant_id", "depth");`);

    this.addSql(`drop index "access_control"."role_delegation_policy_realm_delegator_idx";`);
    this.addSql(`drop index "access_control"."role_delegation_policy_realm_target_idx";`);

    this.addSql(`create index "role_delegation_policy_delegator_idx" on "access_control"."role_delegation_policy" ("delegator_id");`);
    this.addSql(`create index "role_delegation_policy_target_idx" on "access_control"."role_delegation_policy" ("target_id");`);

    this.addSql(`drop index "access_control"."role_permission_assignment_realm_permission_idx";`);
    this.addSql(`drop index "access_control"."role_permission_assignment_realm_role_idx";`);
    this.addSql(`drop index "access_control"."role_permission_assignment_scope_idx";`);

    this.addSql(`create index "role_permission_assignment_permission_idx" on "access_control"."role_permission_assignment" ("permission_id");`);
    this.addSql(`create index "role_permission_assignment_realm_idx" on "access_control"."role_permission_assignment" ("realm_id");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index "access_control"."permission_override_account_idx";`);
    this.addSql(`drop index "access_control"."permission_override_permission_idx";`);

    this.addSql(`create index "permission_override_realm_account_idx" on "access_control"."permission_override" ("realm_id", "account");`);
    this.addSql(`create index "permission_override_realm_permission_idx" on "access_control"."permission_override" ("realm_id", "permission_id");`);

    this.addSql(`drop index "access_control"."account_role_assignment_account_idx";`);
    this.addSql(`drop index "access_control"."account_role_assignment_role_idx";`);

    this.addSql(`create index "account_role_assignment_realm_account_idx" on "access_control"."account_role_assignment" ("realm_id", "account");`);
    this.addSql(`create index "account_role_assignment_realm_role_idx" on "access_control"."account_role_assignment" ("realm_id", "role_id");`);

    this.addSql(`drop index "access_control"."role_closure_ancestor_depth_idx";`);
    this.addSql(`drop index "access_control"."role_closure_descendant_depth_idx";`);

    this.addSql(`create index "role_closure_realm_ancestor_idx" on "access_control"."role_closure" ("realm_id", "ancestor_id");`);
    this.addSql(`create index "role_closure_realm_descendant_idx" on "access_control"."role_closure" ("realm_id", "descendant_id");`);

    this.addSql(`drop index "access_control"."role_delegation_policy_delegator_idx";`);
    this.addSql(`drop index "access_control"."role_delegation_policy_target_idx";`);

    this.addSql(`create index "role_delegation_policy_realm_delegator_idx" on "access_control"."role_delegation_policy" ("realm_id", "delegator_id");`);
    this.addSql(`create index "role_delegation_policy_realm_target_idx" on "access_control"."role_delegation_policy" ("realm_id", "target_id");`);

    this.addSql(`drop index "access_control"."role_permission_assignment_permission_idx";`);
    this.addSql(`drop index "access_control"."role_permission_assignment_realm_idx";`);

    this.addSql(`create index "role_permission_assignment_realm_permission_idx" on "access_control"."role_permission_assignment" ("realm_id", "permission_id");`);
    this.addSql(`create index "role_permission_assignment_realm_role_idx" on "access_control"."role_permission_assignment" ("realm_id", "role_id");`);
    this.addSql(`create index "role_permission_assignment_scope_idx" on "access_control"."role_permission_assignment" ("scope");`);
  }

}
