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

import { EndpointExceptions, ExtractActor, ExtractContext, FormatResponse, RequirePermission } from "~common/decorators";
import { ACCOUNT_ROLE_ASSIGNMENT_COMMAND } from "~context/application/command";
import { ACCOUNT_ROLE_ASSIGNMENT_QUERY } from "~context/application/query";
import { MonitoringInterceptor } from "~common/interceptors";
import { SuccessMessageDTO } from "~common/dto";
import { PermissionCode } from "~context/enums";

import {
    GetAccountRoleAssignmentsListQueryDTO,
    GetAccountRoleAssignmentsListBodyDTO,
    GetAccountRoleAssignmentByIdQueryDTO,
    RestoreAccountRoleAssignmentQueryDTO,
    RestoreAccountRoleAssignmentBodyDTO,
    RevokeAccountRoleAssignmentQueryDTO,
    RevokeAccountRoleAssignmentBodyDTO,
    CreateAccountRoleAssignmentQueryDTO,
    CreateAccountRoleAssignmentBodyDTO,
    PurgeAccountRoleAssignmentQueryDTO,
    PurgeAccountRoleAssignmentBodyDTO,
    AccountRoleAssignmentListDTO,
    AccountRoleAssignmentDTO,
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
        @Inject(ACCOUNT_ROLE_ASSIGNMENT_COMMAND)
        private readonly accountRoleAssignmentCommand: Commands.AccountRoleAssignment.Contract,
        @Inject(ACCOUNT_ROLE_ASSIGNMENT_QUERY)
        private readonly accountRoleAssignmentQuery: Queries.AccountRoleAssignment.Contract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(AccountRoleAssignmentDTO)
    @RequirePermission(ACCOUNT_ROLE_ASSIGNMENT_READ_COMMON)
    @ApiResponse({ status: OK, type: AccountRoleAssignmentDTO })
    @ApiOperation({ summary: "Returns a account role assignment by identifier" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, NOT_FOUND, FORBIDDEN)
    public findUnique(
        @Query() { assignment, realm, view }: GetAccountRoleAssignmentByIdQueryDTO,
    ): Promise<Repositories.AccountRoleAssignment.Entity> {
        return this.accountRoleAssignmentQuery.findUnique({ assignment, realm, view });
    }

    @Post("list")
    @HttpCode(OK)
    @FormatResponse(AccountRoleAssignmentListDTO)
    @RequirePermission(ACCOUNT_ROLE_ASSIGNMENT_READ_COMMON)
    @ApiResponse({ status: OK, type: AccountRoleAssignmentListDTO })
    @ApiOperation({ summary: "Returns a paginated list of account role assignments" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN)
    public findMany(
        @Body() { pagination, filters, sort }: GetAccountRoleAssignmentsListBodyDTO,
        @Query() { realm, view }: GetAccountRoleAssignmentsListQueryDTO,
    ): Promise<[Repositories.AccountRoleAssignment.Entity[], number]> {
        return this.accountRoleAssignmentQuery.findMany({ pagination, filters, realm, sort, view });
    }

    @Post("create")
    @HttpCode(CREATED)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(ACCOUNT_ROLE_ASSIGNMENT_CREATE)
    @ApiResponse({ status: CREATED, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Creates a new account role assignment" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN, CONFLICT)
    public create(
        @Query() { realm }: CreateAccountRoleAssignmentQueryDTO,
        @Body() input: CreateAccountRoleAssignmentBodyDTO,
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
    ): Promise<MessageResult> {
        return this.accountRoleAssignmentCommand.create({ context, realm, actor, input });
    }

    @HttpCode(OK)
    @Patch("revoke")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(ACCOUNT_ROLE_ASSIGNMENT_REVOKE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Revokes a non-system account role assignment(s)" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public revoke(
        @Query() { realm }: RevokeAccountRoleAssignmentQueryDTO,
        @Body() input: RevokeAccountRoleAssignmentBodyDTO,
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
    ): Promise<MessageResult> {
        return this.accountRoleAssignmentCommand.revoke({ context, realm, actor, input });
    }

    @HttpCode(OK)
    @Patch("restore")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(ACCOUNT_ROLE_ASSIGNMENT_RESTORE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Restores a non-system account role assignment(s)" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public restore(
        @Query() { realm }: RestoreAccountRoleAssignmentQueryDTO,
        @Body() input: RestoreAccountRoleAssignmentBodyDTO,
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
    ): Promise<MessageResult> {
        return this.accountRoleAssignmentCommand.restore({ context, realm, actor, input });
    }

    @HttpCode(OK)
    @Delete("purge")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(ACCOUNT_ROLE_ASSIGNMENT_PURGE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Permanently deletes a revoked non-system account role assignment(s)" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public purge(
        @Query() { realm }: PurgeAccountRoleAssignmentQueryDTO,
        @Body() input: PurgeAccountRoleAssignmentBodyDTO,
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
    ): Promise<MessageResult> {
        return this.accountRoleAssignmentCommand.purge({ context, realm, actor, input });
    }
}
