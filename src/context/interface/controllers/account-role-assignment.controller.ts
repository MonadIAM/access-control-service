import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import {
    UseInterceptors,
    Controller,
    HttpStatus,
    HttpCode,
    Delete,
    Inject,
    Patch,
    Query,
    Body,
    Post,
    Get,
} from "@nestjs/common";

import { RequirePermission, FormatResponse, Swagger, Extract } from "~common/decorators";
import { ACCOUNT_ROLE_ASSIGNMENT_COMMANDS } from "~context/application/commands";
import { ACCOUNT_ROLE_ASSIGNMENT_QUERIES } from "~context/application/queries";
import { MonitoringInterceptor } from "~common/interceptors";
import { SuccessMessageDTO } from "~common/dto";
import { PermissionCode } from "~context/enums";

import {
    AccountRoleAssignmentDTO,
    GetListQueryDTO,
    GetByIdQueryDTO,
    RestoreQueryDTO,
    GetListBodyDTO,
    RestoreBodyDTO,
    RevokeQueryDTO,
    CreateQueryDTO,
    RevokeBodyDTO,
    CreateBodyDTO,
    PurgeQueryDTO,
    PurgeBodyDTO,
    ListDTO,
} from "../dto/account-role-assignment";

const {
    INTERNAL_SERVER_ERROR,
    UNPROCESSABLE_ENTITY,
    UNAUTHORIZED,
    BAD_REQUEST,
    FORBIDDEN,
    NOT_FOUND,
    CONFLICT,
    CREATED,
    OK,
} = HttpStatus;
const {
    ACCOUNT_ROLE_ASSIGNMENT_READ_COMMON,
    ACCOUNT_ROLE_ASSIGNMENT_RESTORE,
    ACCOUNT_ROLE_ASSIGNMENT_CREATE,
    ACCOUNT_ROLE_ASSIGNMENT_REVOKE,
    ACCOUNT_ROLE_ASSIGNMENT_PURGE,
} = PermissionCode;

@ApiTags("AccountRoleAssignment")
@Controller("/account-role-assignment")
@UseInterceptors(MonitoringInterceptor)
export class AccountRoleAssignmentController {
    public constructor(
        @Inject(ACCOUNT_ROLE_ASSIGNMENT_COMMANDS)
        private readonly accountRoleAssignmentCommands: Commands.AccountRoleAssignment.ControllerContract,
        @Inject(ACCOUNT_ROLE_ASSIGNMENT_QUERIES)
        private readonly accountRoleAssignmentQueries: Queries.AccountRoleAssignment.Contract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(AccountRoleAssignmentDTO)
    @RequirePermission(ACCOUNT_ROLE_ASSIGNMENT_READ_COMMON)
    @ApiResponse({ status: OK, type: AccountRoleAssignmentDTO })
    @ApiOperation({ summary: "Returns a account role assignment by identifier" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, NOT_FOUND, FORBIDDEN)
    public findUnique(
        @Query() { assignment, realm, view }: GetByIdQueryDTO,
    ): Promise<Queries.AccountRoleAssignment.Entity> {
        return this.accountRoleAssignmentQueries.findUnique({ assignment, realm, view });
    }

    @Post("list")
    @HttpCode(OK)
    @FormatResponse(ListDTO)
    @RequirePermission(ACCOUNT_ROLE_ASSIGNMENT_READ_COMMON)
    @ApiResponse({ status: OK, type: ListDTO })
    @ApiOperation({ summary: "Returns a paginated list of account role assignments" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN)
    public findMany(
        @Body() { pagination, filters, sort }: GetListBodyDTO,
        @Query() { realm, view }: GetListQueryDTO,
    ): Promise<[Queries.AccountRoleAssignment.Entity[], number]> {
        return this.accountRoleAssignmentQueries.findMany({ pagination, filters, realm, sort, view });
    }

    @Post("create")
    @HttpCode(CREATED)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(ACCOUNT_ROLE_ASSIGNMENT_CREATE)
    @ApiResponse({ status: CREATED, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Creates a new account role assignment" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN, CONFLICT)
    public create(
        @Query() { realm }: CreateQueryDTO,
        @Body() input: CreateBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Promise<MessageResult> {
        return this.accountRoleAssignmentCommands.create({ context, realm, actor, input });
    }

    @HttpCode(OK)
    @Patch("revoke")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(ACCOUNT_ROLE_ASSIGNMENT_REVOKE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Revokes a non-system account role assignment(s)" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public revoke(
        @Query() { realm }: RevokeQueryDTO,
        @Body() input: RevokeBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Promise<MessageResult> {
        return this.accountRoleAssignmentCommands.revoke({ context, realm, actor, input });
    }

    @HttpCode(OK)
    @Patch("restore")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(ACCOUNT_ROLE_ASSIGNMENT_RESTORE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Restores a non-system account role assignment(s)" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public restore(
        @Query() { realm }: RestoreQueryDTO,
        @Body() input: RestoreBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Promise<MessageResult> {
        return this.accountRoleAssignmentCommands.restore({ context, realm, actor, input });
    }

    @HttpCode(OK)
    @Delete("purge")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(ACCOUNT_ROLE_ASSIGNMENT_PURGE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Permanently deletes a revoked non-system account role assignment(s)" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public purge(
        @Query() { realm }: PurgeQueryDTO,
        @Body() input: PurgeBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Promise<MessageResult> {
        return this.accountRoleAssignmentCommands.purge({ context, realm, actor, input });
    }
}
