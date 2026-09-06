import { Controller, HttpStatus, HttpCode, Delete, Inject, Patch, Query, Body, Post, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { RequirePermission, FormatResponse, Swagger, Extract } from "~common/decorators";
import { ROLE_PERMISSION_ASSIGNMENT_COMMANDS } from "~context/application/commands";
import { ROLE_PERMISSION_ASSIGNMENT_QUERIES } from "~context/application/queries";
import { SuccessMessageDTO } from "~common/dto";
import { PermissionCode } from "~context/enums";

import {
    RolePermissionAssignmentDTO,
    GetListQueryDTO,
    GetByIdQueryDTO,
    RestoreQueryDTO,
    GetListBodyDTO,
    RestoreBodyDTO,
    RevokeQueryDTO,
    CreateQueryDTO,
    PurgeQueryDTO,
    RevokeBodyDTO,
    CreateBodyDTO,
    PurgeBodyDTO,
    ListDTO,
} from "../dto/role-permission-assignment";

const {
    INTERNAL_SERVER_ERROR,
    UNPROCESSABLE_ENTITY,
    SERVICE_UNAVAILABLE,
    REQUEST_TIMEOUT,
    UNAUTHORIZED,
    BAD_REQUEST,
    FORBIDDEN,
    NOT_FOUND,
    CONFLICT,
    CREATED,
    OK,
} = HttpStatus;
const {
    ROLE_PERMISSION_ASSIGNMENT_READ_ABSOLUTE,
    ROLE_PERMISSION_ASSIGNMENT_READ_COMMON,
    ROLE_PERMISSION_ASSIGNMENT_RESTORE,
    ROLE_PERMISSION_ASSIGNMENT_CREATE,
    ROLE_PERMISSION_ASSIGNMENT_REVOKE,
    ROLE_PERMISSION_ASSIGNMENT_PURGE,
} = PermissionCode;

@ApiTags("RolePermissionAssignment")
@Controller("/role-permission-assignment")
export class RolePermissionAssignmentController {
    public constructor(
        @Inject(ROLE_PERMISSION_ASSIGNMENT_COMMANDS)
        private readonly rolePermissionAssignmentCommands: Commands.RolePermissionAssignment.ControllerContract,
        @Inject(ROLE_PERMISSION_ASSIGNMENT_QUERIES)
        private readonly rolePermissionAssignmentQueries: Queries.RolePermissionAssignment.ControllerContract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(RolePermissionAssignmentDTO)
    @RequirePermission(ROLE_PERMISSION_ASSIGNMENT_READ_ABSOLUTE, ROLE_PERMISSION_ASSIGNMENT_READ_COMMON)
    @ApiResponse({ status: OK, type: RolePermissionAssignmentDTO })
    @ApiOperation({
        summary: "Returns a role-permission assignment by identifier",
        security: [{ identity: [] }],
    })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        NOT_FOUND,
        FORBIDDEN,
    )
    public findUnique(
        @Query() { assignment, realm, view }: GetByIdQueryDTO,
    ): Queries.RolePermissionAssignment.FindUnique.Result {
        return this.rolePermissionAssignmentQueries.findUnique({ assignment, realm, view });
    }

    @Post("list")
    @HttpCode(OK)
    @FormatResponse(ListDTO)
    @ApiResponse({ status: OK, type: ListDTO })
    @RequirePermission(ROLE_PERMISSION_ASSIGNMENT_READ_ABSOLUTE, ROLE_PERMISSION_ASSIGNMENT_READ_COMMON)
    @ApiOperation({
        summary: "Returns a paginated list of role-permission assignments",
        security: [{ identity: [] }],
    })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        FORBIDDEN,
    )
    public findMany(
        @Body() { pagination, filters, sort }: GetListBodyDTO,
        @Query() { realm, view }: GetListQueryDTO,
    ): Queries.RolePermissionAssignment.FindMany.Result {
        return this.rolePermissionAssignmentQueries.findMany({ pagination, filters, sort, realm, view });
    }

    @Post("create")
    @HttpCode(CREATED)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(ROLE_PERMISSION_ASSIGNMENT_CREATE)
    @ApiResponse({ status: CREATED, type: SuccessMessageDTO })
    @ApiOperation({
        summary: "Creates a new role-permission assignment",
        security: [{ identity: [] }],
    })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        BAD_REQUEST,
        NOT_FOUND,
        FORBIDDEN,
        CONFLICT,
    )
    public create(
        @Query() { realm }: CreateQueryDTO,
        @Body() input: CreateBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Promise<MessageResult> {
        return this.rolePermissionAssignmentCommands.create({ actor, context, input, realm });
    }

    @HttpCode(OK)
    @Patch("revoke")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(ROLE_PERMISSION_ASSIGNMENT_REVOKE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({
        summary: "Revokes a non-system role-permission assignment(s)",
        security: [{ identity: [] }],
    })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        BAD_REQUEST,
        NOT_FOUND,
        FORBIDDEN,
    )
    public revoke(
        @Query() { realm }: RevokeQueryDTO,
        @Body() input: RevokeBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Promise<MessageResult> {
        return this.rolePermissionAssignmentCommands.revoke({ actor, context, input, realm });
    }

    @HttpCode(OK)
    @Patch("restore")
    @FormatResponse(SuccessMessageDTO)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @RequirePermission(ROLE_PERMISSION_ASSIGNMENT_RESTORE)
    @ApiOperation({
        summary: "Restores a non-system role-permission assignment(s)",
        security: [{ identity: [] }],
    })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        BAD_REQUEST,
        NOT_FOUND,
        FORBIDDEN,
    )
    public restore(
        @Query() { realm }: RestoreQueryDTO,
        @Body() input: RestoreBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Promise<MessageResult> {
        return this.rolePermissionAssignmentCommands.restore({ actor, context, input, realm });
    }

    @HttpCode(OK)
    @Delete("purge")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(ROLE_PERMISSION_ASSIGNMENT_PURGE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({
        summary: "Permanently deletes a revoked non-system role-permission assignment(s)",
        security: [{ identity: [] }],
    })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        BAD_REQUEST,
        NOT_FOUND,
        FORBIDDEN,
    )
    public purge(
        @Query() { realm }: PurgeQueryDTO,
        @Body() input: PurgeBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Promise<MessageResult> {
        return this.rolePermissionAssignmentCommands.purge({ actor, context, input, realm });
    }
}
