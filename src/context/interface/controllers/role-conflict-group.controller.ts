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
import { ROLE_CONFLICT_GROUP_COMMAND } from "~context/application/command";
import { ROLE_CONFLICT_GROUP_QUERY } from "~context/application/query";
import { MonitoringInterceptor } from "~common/interceptors";
import { SuccessMessageDTO } from "~common/dto";
import { PermissionCode } from "~context/enums";

import {
    RoleConflictGroupPaginatedListDTO,
    GetRoleConflictGroupsListQueryDTO,
    GetRoleConflictGroupsListBodyDTO,
    GetRoleConflictGroupByIdQueryDTO,
    RestoreRoleConflictGroupQueryDTO,
    RestoreRoleConflictGroupBodyDTO,
    RevokeRoleConflictGroupQueryDTO,
    CreateRoleConflictGroupQueryDTO,
    UpdateRoleConflictGroupQueryDTO,
    UpdateRoleConflictGroupBodyDTO,
    RevokeRoleConflictGroupBodyDTO,
    CreateRoleConflictGroupBodyDTO,
    PurgeRoleConflictGroupQueryDTO,
    PurgeRoleConflictGroupBodyDTO,
    GetViolationDetailsQueryDTO,
    GetViolationDetailsBodyDTO,
    RoleConflictGroupListDTO,
    RoleConflictGroupDTO,
} from "../dto/role-conflict-group";

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
    ROLE_CONFLICT_GROUP_READ_ABSOLUTE,
    ROLE_CONFLICT_GROUP_RESTORE,
    ROLE_CONFLICT_GROUP_CREATE,
    ROLE_CONFLICT_GROUP_UPDATE,
    ROLE_CONFLICT_GROUP_REVOKE,
    ROLE_CONFLICT_GROUP_PURGE,
} = PermissionCode;

@ApiTags("RoleConflictGroup")
@Controller("/role-conflict-group")
@UseInterceptors(MonitoringInterceptor)
export class RoleConflictGroupController {
    public constructor(
        @Inject(ROLE_CONFLICT_GROUP_COMMAND)
        private readonly roleConflictGroupCommand: Commands.RoleConflictGroup.Contract,
        @Inject(ROLE_CONFLICT_GROUP_QUERY)
        private readonly roleConflictGroupQuery: Queries.RoleConflictGroup.Contract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(RoleConflictGroupDTO)
    @RequirePermission(ROLE_CONFLICT_GROUP_READ_ABSOLUTE)
    @ApiResponse({ status: OK, type: RoleConflictGroupDTO })
    @ApiOperation({ summary: "Returns a role conflict group by identifier" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, NOT_FOUND, FORBIDDEN)
    public findUnique(
        @Query() { group, realm, view }: GetRoleConflictGroupByIdQueryDTO,
    ): Promise<Repositories.RoleConflictGroup.Entity> {
        return this.roleConflictGroupQuery.findUnique({ group, realm, view });
    }

    @Post("list")
    @HttpCode(OK)
    @FormatResponse(RoleConflictGroupPaginatedListDTO)
    @RequirePermission(ROLE_CONFLICT_GROUP_READ_ABSOLUTE)
    @ApiResponse({ status: OK, type: RoleConflictGroupPaginatedListDTO })
    @ApiOperation({ summary: "Returns a paginated list of role conflict groups" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN)
    public findMany(
        @Body() { pagination, filters, sort }: GetRoleConflictGroupsListBodyDTO,
        @Query() { realm, view }: GetRoleConflictGroupsListQueryDTO,
    ): Promise<[Repositories.RoleConflictGroup.Entity[], number]> {
        return this.roleConflictGroupQuery.findMany({ pagination, filters, realm, sort, view });
    }

    @HttpCode(OK)
    @Post("violation-details")
    @FormatResponse(RoleConflictGroupListDTO)
    @RequirePermission(ROLE_CONFLICT_GROUP_CREATE)
    @ApiResponse({ status: OK, type: RoleConflictGroupListDTO })
    @ApiOperation({ summary: "Returns a list of SoD violation details" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN)
    public findViolationDetails(
        @Body() { account, roles }: GetViolationDetailsBodyDTO,
        @Query() { realm }: GetViolationDetailsQueryDTO,
    ): Promise<Repositories.RoleConflictGroup.Entity[]> {
        return this.roleConflictGroupQuery.findViolationDetails({ account, realm, roles });
    }

    @Post("create")
    @HttpCode(CREATED)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(ROLE_CONFLICT_GROUP_CREATE)
    @ApiResponse({ status: CREATED, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Creates a new role conflict group" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN, CONFLICT)
    public create(
        @Query() { realm }: CreateRoleConflictGroupQueryDTO,
        @ExtractActor() { account: actor }: ActorContext,
        @Body() input: CreateRoleConflictGroupBodyDTO,
        @ExtractContext() context: RequestContext,
    ): Promise<MessageResult> {
        return this.roleConflictGroupCommand.create({ context, realm, actor, input });
    }

    @HttpCode(OK)
    @Patch("update")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(ROLE_CONFLICT_GROUP_UPDATE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Updates role conflict group metadata" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public updateMetadata(
        @Query() { realm, id }: UpdateRoleConflictGroupQueryDTO,
        @ExtractActor() { account: actor }: ActorContext,
        @Body() input: UpdateRoleConflictGroupBodyDTO,
        @ExtractContext() context: RequestContext,
    ): Promise<MessageResult> {
        return this.roleConflictGroupCommand.update({ context, realm, actor, input, id });
    }

    @HttpCode(OK)
    @Patch("revoke")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(ROLE_CONFLICT_GROUP_REVOKE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Revokes a non-system role conflict group(s)" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public revoke(
        @Query() { realm }: RevokeRoleConflictGroupQueryDTO,
        @ExtractActor() { account: actor }: ActorContext,
        @Body() input: RevokeRoleConflictGroupBodyDTO,
        @ExtractContext() context: RequestContext,
    ): Promise<MessageResult> {
        return this.roleConflictGroupCommand.revoke({ context, realm, actor, input });
    }

    @HttpCode(OK)
    @Patch("restore")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(ROLE_CONFLICT_GROUP_RESTORE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Restores a non-system role conflict group(s)" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public restore(
        @Query() { realm }: RestoreRoleConflictGroupQueryDTO,
        @ExtractActor() { account: actor }: ActorContext,
        @Body() input: RestoreRoleConflictGroupBodyDTO,
        @ExtractContext() context: RequestContext,
    ): Promise<MessageResult> {
        return this.roleConflictGroupCommand.restore({ context, realm, actor, input });
    }

    @HttpCode(OK)
    @Delete("purge")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(ROLE_CONFLICT_GROUP_PURGE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Permanently deletes a revoked non-system role conflict group(s)" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public purge(
        @Query() { realm }: PurgeRoleConflictGroupQueryDTO,
        @ExtractActor() { account: actor }: ActorContext,
        @Body() input: PurgeRoleConflictGroupBodyDTO,
        @ExtractContext() context: RequestContext,
    ): Promise<MessageResult> {
        return this.roleConflictGroupCommand.purge({ context, realm, actor, input });
    }
}
