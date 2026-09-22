import { jest } from "@jest/globals";

import { AccountRoleAssignmentCommands } from "~context/application/commands/account-role-assignment.commands";

import { ApplicationCommandUnitHelpers } from "./core.helpers";

export class AccountRoleAssignmentCommandsUnitHelpers
    extends ApplicationCommandUnitHelpers
    implements Unit.Commands.AccountRoleAssignment.Contract
{
    public commands(): Unit.Commands.AccountRoleAssignment.Commands.Result {
        const execution = this.execution();

        const repository = {
            find: jest.fn<Repositories.AccountRoleAssignment.PublicContract["find"]>(),
        };
        const cache = {
            validateAssignments: jest.fn<InfrastructureServices.ProjectionCache.ValidateAssignments.Signature>(),
            checkRealm: jest.fn<InfrastructureServices.ProjectionCache.CheckRealm.Signature>(),
        };
        const assignments = {
            assign: jest.fn<Services.AccountRoleAssignment.Assign.Signature>(),
            revoke: jest.fn<Services.AccountRoleAssignment.Revoke.Signature>(),
            restore: jest.fn<Services.AccountRoleAssignment.Restore.Signature>(),
            expire: jest.fn<Services.AccountRoleAssignment.Expire.Signature>(),
            clean: jest.fn<Services.AccountRoleAssignment.Clean.Signature>(),
            create: jest.fn<Services.AccountRoleAssignment.Create.Signature>(),
            ensure: jest.fn<Services.AccountRoleAssignment.Ensure.Signature>(),
            purge: jest.fn<Services.AccountRoleAssignment.Purge.Signature>(),
        };
        const overrides = {
            clean: jest.fn<Services.PermissionOverride.Clean.Signature>(),
        };

        return {
            commands: new AccountRoleAssignmentCommands(
                execution.transactional,
                this.contract<Repositories.AccountRoleAssignment.PublicContract>(repository),
                this.contract<Services.AccountRoleAssignment.CommandContract>(assignments),
                this.contract<Services.PermissionOverride.CommandContract>(overrides),
                this.contract<InfrastructureServices.ProjectionCache.PublicContract>(cache),
            ),
            ...execution,
            assignments,
            repository,
            overrides,
            cache,
        };
    }
}
