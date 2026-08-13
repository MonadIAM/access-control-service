import { Migration } from '@mikro-orm/migrations';

export class Migration20260813042709_align_justification_columns extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`alter table "access_control"."permission_override" add "justification" text null;`);

    this.addSql(`alter table "access_control"."account_role_assignment" add "justification" text null;`);

    this.addSql(`alter table "access_control"."role_delegation_policy" rename column "description" to "justification";`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "access_control"."account_role_assignment" drop column "justification";`);

    this.addSql(`alter table "access_control"."permission_override" drop column "justification";`);

    this.addSql(`alter table "access_control"."role_delegation_policy" rename column "justification" to "description";`);
  }

}
