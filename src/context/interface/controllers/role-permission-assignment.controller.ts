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
import { ROLE_PERMISSION_ASSIGNMENT_COMMANDS } from "~context/application/commands";
import { ROLE_PERMISSION_ASSIGNMENT_QUERIES } from "~context/application/queries";
import { MonitoringInterceptor } from "~common/interceptors";
import { SuccessMessageDTO } from "~common/dto";
import { PermissionCode } from "~context/enums";

import {
    GetRolePermissionAssignmentsListQueryDTO,
    GetRolePermissionAssignmentsListBodyDTO,
    GetRolePermissionAssignmentByIdQueryDTO,
    RestoreRolePermissionAssignmentQueryDTO,
    RestoreRolePermissionAssignmentBodyDTO,
    RevokeRolePermissionAssignmentQueryDTO,
    CreateRolePermissionAssignmentQueryDTO,
    PurgeRolePermissionAssignmentQueryDTO,
    RevokeRolePermissionAssignmentBodyDTO,
    CreateRolePermissionAssignmentBodyDTO,
    PurgeRolePermissionAssignmentBodyDTO,
    RolePermissionAssignmentListDTO,
    RolePermissionAssignmentDTO,
} from "../dto/role-permission-assignment";

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
    ROLE_PERMISSION_ASSIGNMENT_READ_COMMON,
    ROLE_PERMISSION_ASSIGNMENT_RESTORE,
    ROLE_PERMISSION_ASSIGNMENT_CREATE,
    ROLE_PERMISSION_ASSIGNMENT_REVOKE,
    ROLE_PERMISSION_ASSIGNMENT_PURGE,
} = PermissionCode;

@ApiTags("RolePermissionAssignment")
@Controller("/role-permission-assignment")
@UseInterceptors(MonitoringInterceptor)
export class RolePermissionAssignmentController {
    public constructor(
        @Inject(ROLE_PERMISSION_ASSIGNMENT_COMMANDS)
        private readonly rolePermissionAssignmentCommands: Commands.RolePermissionAssignment.Contract,
        @Inject(ROLE_PERMISSION_ASSIGNMENT_QUERIES)
        private readonly rolePermissionAssignmentQueries: Queries.RolePermissionAssignment.Contract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(RolePermissionAssignmentDTO)
    @RequirePermission(ROLE_PERMISSION_ASSIGNMENT_READ_COMMON)
    @ApiResponse({ status: OK, type: RolePermissionAssignmentDTO })
    @ApiOperation({ summary: "Returns a role-permission assignment by identifier" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, NOT_FOUND, FORBIDDEN)
    public findUnique(
        @Query() { assignment, realm, view }: GetRolePermissionAssignmentByIdQueryDTO,
    ): Promise<Queries.RolePermissionAssignment.Entity> {
        return this.rolePermissionAssignmentQueries.findUnique({ assignment, realm, view });
    }

    @Post("list")
    @HttpCode(OK)
    @FormatResponse(RolePermissionAssignmentListDTO)
    @RequirePermission(ROLE_PERMISSION_ASSIGNMENT_READ_COMMON)
    @ApiResponse({ status: OK, type: RolePermissionAssignmentListDTO })
    @ApiOperation({ summary: "Returns a paginated list of role-permission assignments" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN)
    public findMany(
        @Body() { pagination, filters, sort }: GetRolePermissionAssignmentsListBodyDTO,
        @Query() { realm, view }: GetRolePermissionAssignmentsListQueryDTO,
    ): Promise<[Queries.RolePermissionAssignment.Entity[], number]> {
        return this.rolePermissionAssignmentQueries.findMany({ pagination, filters, sort, realm, view });
    }

    @Post("create")
    @HttpCode(CREATED)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(ROLE_PERMISSION_ASSIGNMENT_CREATE)
    @ApiResponse({ status: CREATED, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Creates a new role-permission assignment" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN, CONFLICT)
    public create(
        @Query() { realm }: CreateRolePermissionAssignmentQueryDTO,
        @Body() input: CreateRolePermissionAssignmentBodyDTO,
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
    ): Promise<MessageResult> {
        return this.rolePermissionAssignmentCommands.create({ actor, context, input, realm });
    }

    @HttpCode(OK)
    @Patch("revoke")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(ROLE_PERMISSION_ASSIGNMENT_REVOKE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Revokes a non-system role-permission assignment(s)" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public revoke(
        @Query() { realm }: RevokeRolePermissionAssignmentQueryDTO,
        @Body() input: RevokeRolePermissionAssignmentBodyDTO,
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
    ): Promise<MessageResult> {
        return this.rolePermissionAssignmentCommands.revoke({ actor, context, input, realm });
    }

    @HttpCode(OK)
    @Patch("restore")
    @FormatResponse(SuccessMessageDTO)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @RequirePermission(ROLE_PERMISSION_ASSIGNMENT_RESTORE)
    @ApiOperation({ summary: "Restores a non-system role-permission assignment(s)" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public restore(
        @Query() { realm }: RestoreRolePermissionAssignmentQueryDTO,
        @Body() input: RestoreRolePermissionAssignmentBodyDTO,
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
    ): Promise<MessageResult> {
        return this.rolePermissionAssignmentCommands.restore({ actor, context, input, realm });
    }

    @HttpCode(OK)
    @Delete("purge")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(ROLE_PERMISSION_ASSIGNMENT_PURGE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Permanently deletes a revoked non-system role-permission assignment(s)" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public purge(
        @Query() { realm }: PurgeRolePermissionAssignmentQueryDTO,
        @Body() input: PurgeRolePermissionAssignmentBodyDTO,
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
    ): Promise<MessageResult> {
        return this.rolePermissionAssignmentCommands.purge({ actor, context, input, realm });
    }
}
