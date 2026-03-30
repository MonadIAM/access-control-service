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
import { ROLE_PERMISSION_ASSIGNMENT_OPERATION } from "~context/application/operations";
import { ROLE_PERMISSION_ASSIGNMENT_QUERY } from "~context/application/query";
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
        @Inject(ROLE_PERMISSION_ASSIGNMENT_OPERATION)
        private readonly rolePermissionAssignmentOperation: Operations.RolePermissionAssignment.Contract,
        @Inject(ROLE_PERMISSION_ASSIGNMENT_QUERY)
        private readonly rolePermissionAssignmentQuery: Queries.RolePermissionAssignment.Contract,
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
    ): Promise<Repositories.RolePermissionAssignment.Entity> {
        return this.rolePermissionAssignmentQuery.findUnique({ assignment, realm, view });
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
    ): Promise<[Repositories.RolePermissionAssignment.Entity[], number]> {
        return this.rolePermissionAssignmentQuery.findMany({ pagination, filters, sort, realm, view });
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
        return this.rolePermissionAssignmentOperation.create({ actor, context, input, realm });
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
        return this.rolePermissionAssignmentOperation.revoke({ actor, context, input, realm });
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
        return this.rolePermissionAssignmentOperation.restore({ actor, context, input, realm });
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
        return this.rolePermissionAssignmentOperation.purge({ actor, context, input, realm });
    }
}
