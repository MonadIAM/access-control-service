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

import { ROLE_COMMANDS } from "~context/application/commands";
import { MonitoringInterceptor } from "~common/interceptors";
import { ROLE_QUERIES } from "~context/application/queries";
import { SuccessMessageDTO } from "~common/dto";
import { PermissionCode } from "~context/enums";
import {
    ExtractPermissions,
    EndpointExceptions,
    RequirePermission,
    ExtractContext,
    FormatResponse,
    ExtractActor,
} from "~common/decorators";

import {
    GetDelegableRolesListByAccountQueryDTO,
    GetDelegableRolesListByRoleQueryDTO,
    GetRoleDescendantsListQueryDTO,
    GetRoleDescendantsListBodyDTO,
    GetRoleHierarchyGraphQueryDTO,
    GetEffectiveRolesListQueryDTO,
    GetDelegableRolesListBodyDTO,
    GetEffectiveRolesListBodyDTO,
    GetRoleAncestorsListQueryDTO,
    GetRoleAncestorsListBodyDTO,
    GetRolesLookupListQueryDTO,
    GetRolesLookupListBodyDTO,
    PurgeRoleSubtreeQueryDTO,
    PurgeRoleSubtreeBodyDTO,
    RoleHierarchyGraphDTO,
    RoleHierarchyListDTO,
    GetRolesListQueryDTO,
    RestoreRoleQueryDTO,
    GetRoleByIdQueryDTO,
    GetRolesListBodyDTO,
    CreateRoleQueryDTO,
    RevokeRoleQueryDTO,
    UpdateRoleQueryDTO,
    RestoreRoleBodyDTO,
    CreateRoleBodyDTO,
    RevokeRoleBodyDTO,
    UpdateRoleBodyDTO,
    PurgeRoleQueryDTO,
    RoleLookupListDTO,
    PurgeRoleBodyDTO,
    RoleListDTO,
    RoleDTO,
} from "../dto/role";

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
    ROLE_PURGE_SUBTREE,
    ROLE_READ_PERSONAL,
    ROLE_READ_ABSOLUTE,
    ROLE_READ_COMMON,
    ROLE_RESTORE,
    ROLE_CREATE,
    ROLE_UPDATE,
    ROLE_REVOKE,
    ROLE_PURGE,
} = PermissionCode;

@ApiTags("Role")
@Controller("/role")
@UseInterceptors(MonitoringInterceptor)
export class RoleController {
    public constructor(
        @Inject(ROLE_COMMANDS)
        private readonly roleCommands: Commands.Role.Contract,
        @Inject(ROLE_QUERIES)
        private readonly roleQueries: Queries.Role.Contract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(RoleDTO)
    @RequirePermission(ROLE_READ_COMMON)
    @ApiResponse({ status: OK, type: RoleDTO })
    @ApiOperation({ summary: "Returns a role by identifier" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, NOT_FOUND, FORBIDDEN)
    public findUnique(@Query() { realm, role, view }: GetRoleByIdQueryDTO): Promise<Queries.Role.Entity> {
        return this.roleQueries.findUnique({ realm, role, view });
    }

    @HttpCode(OK)
    @Post("list")
    @FormatResponse(RoleListDTO)
    @RequirePermission(ROLE_READ_COMMON)
    @ApiResponse({ status: OK, type: RoleListDTO })
    @ApiOperation({ summary: "Returns a paginated list of roles" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN)
    public findMany(
        @Query() { realm, view }: GetRolesListQueryDTO,
        @Body() { pagination, filters, sort }: GetRolesListBodyDTO,
    ): Promise<[Queries.Role.Entity[], number]> {
        return this.roleQueries.findMany({ pagination, filters, realm, sort, view });
    }

    @HttpCode(OK)
    @Post("list/ancestors")
    @RequirePermission(ROLE_READ_COMMON)
    @FormatResponse(RoleHierarchyListDTO)
    @ApiResponse({ status: OK, type: RoleHierarchyListDTO })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN)
    @ApiOperation({ summary: "Returns a paginated list of ancestor roles of the specified role, including itself" })
    public findAncestors(
        @Query() { descendant, realm, view }: GetRoleAncestorsListQueryDTO,
        @Body() { pagination, filters }: GetRoleAncestorsListBodyDTO,
    ): Promise<[Queries.Role.DepthEntity[], number]> {
        return this.roleQueries.findAncestors({ descendant, pagination, filters, realm, view });
    }

    @HttpCode(OK)
    @Post("list/descendants")
    @RequirePermission(ROLE_READ_COMMON)
    @FormatResponse(RoleHierarchyListDTO)
    @ApiResponse({ status: OK, type: RoleHierarchyListDTO })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN)
    @ApiOperation({ summary: "Returns a paginated list of descendant roles of the specified role, including itself" })
    public findDescendants(
        @Query() { ancestor, realm, view }: GetRoleDescendantsListQueryDTO,
        @Body() { pagination, filters }: GetRoleDescendantsListBodyDTO,
    ): Promise<[Queries.Role.DepthEntity[], number]> {
        return this.roleQueries.findDescendants({ pagination, ancestor, filters, realm, view });
    }

    @HttpCode(OK)
    @FormatResponse(RoleListDTO)
    @Post("list/delegable/by-account")
    @ApiResponse({ status: OK, type: RoleListDTO })
    @RequirePermission(ROLE_READ_PERSONAL, ROLE_READ_ABSOLUTE)
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN)
    @ApiOperation({ summary: "Returns a paginated list of roles that can be delegated by the specified account" })
    public findDelegableByAccount(
        @Body() { pagination, filters, sort }: GetDelegableRolesListBodyDTO,
        @Query() { realm, id }: GetDelegableRolesListByAccountQueryDTO,
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractPermissions() permissions?: string[],
    ): Promise<[Queries.Role.Entity[], number]> {
        return this.roleQueries.findDelegableByAccount({ permissions, pagination, filters, sort, realm, actor, id });
    }

    @HttpCode(OK)
    @FormatResponse(RoleListDTO)
    @Post("list/delegable/by-role")
    @RequirePermission(ROLE_READ_COMMON)
    @ApiResponse({ status: OK, type: RoleListDTO })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN)
    @ApiOperation({ summary: "Returns a paginated list of roles that can be delegated from the specified role" })
    public findDelegableByRole(
        @Body() { pagination, filters, sort }: GetDelegableRolesListBodyDTO,
        @Query() { realm, id }: GetDelegableRolesListByRoleQueryDTO,
    ): Promise<[Queries.Role.Entity[], number]> {
        return this.roleQueries.findDelegableByRole({ pagination, filters, sort, realm, id });
    }

    @HttpCode(OK)
    @Post("list/effective")
    @FormatResponse(RoleListDTO)
    @ApiResponse({ status: OK, type: RoleListDTO })
    @RequirePermission(ROLE_READ_PERSONAL, ROLE_READ_ABSOLUTE)
    @ApiOperation({ summary: "Returns a paginated list of effective roles for the account" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN)
    public findEffective(
        @Body() { pagination, filters, sort }: GetEffectiveRolesListBodyDTO,
        @Query() { realm, account }: GetEffectiveRolesListQueryDTO,
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractPermissions() permissions?: string[],
    ): Promise<[Queries.Role.Entity[], number]> {
        return this.roleQueries.findEffective({ permissions, pagination, filters, sort, account, actor, realm });
    }

    @HttpCode(OK)
    @Post("list/lookup")
    @FormatResponse(RoleLookupListDTO)
    @RequirePermission(ROLE_READ_COMMON)
    @ApiResponse({ status: OK, type: RoleLookupListDTO })
    @ApiOperation({ summary: "Returns a lookup list of roles" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN)
    public getLookupList(
        @Query() { realm, term }: GetRolesLookupListQueryDTO,
        @Body() { pagination }: GetRolesLookupListBodyDTO,
    ): Promise<[Queries.Role.Entity[], number]> {
        return this.roleQueries.getLookupList({ pagination, realm, term });
    }

    @HttpCode(OK)
    @Get("hierarchy-graph")
    @RequirePermission(ROLE_READ_COMMON)
    @FormatResponse(RoleHierarchyGraphDTO)
    @ApiResponse({ status: OK, type: RoleHierarchyGraphDTO })
    @ApiOperation({ summary: "Returns the role hierarchy graph (nodes and edges)" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN)
    public getHierarchyGraph(@Query() { realm }: GetRoleHierarchyGraphQueryDTO): Promise<Queries.Role.Graph> {
        return this.roleQueries.getHierarchyGraph({ realm });
    }

    @Post("create")
    @HttpCode(CREATED)
    @RequirePermission(ROLE_CREATE)
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Creates a new role" })
    @ApiResponse({ status: CREATED, type: SuccessMessageDTO })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN, CONFLICT)
    public create(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm }: CreateRoleQueryDTO,
        @Body() input: CreateRoleBodyDTO,
    ): Promise<MessageResult> {
        return this.roleCommands.create({ actor, context, input, realm });
    }

    @HttpCode(OK)
    @Patch("update")
    @RequirePermission(ROLE_UPDATE)
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Updates role metadata" })
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public updateMetadata(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm, id }: UpdateRoleQueryDTO,
        @Body() input: UpdateRoleBodyDTO,
    ): Promise<MessageResult> {
        return this.roleCommands.update({ actor, context, input, realm, id });
    }

    @HttpCode(OK)
    @Patch("revoke")
    @RequirePermission(ROLE_REVOKE)
    @FormatResponse(SuccessMessageDTO)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Revokes a non-system role" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public revoke(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm }: RevokeRoleQueryDTO,
        @Body() input: RevokeRoleBodyDTO,
    ): Promise<MessageResult> {
        return this.roleCommands.revoke({ actor, context, input, realm });
    }

    @HttpCode(OK)
    @Patch("restore")
    @RequirePermission(ROLE_RESTORE)
    @FormatResponse(SuccessMessageDTO)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Restores a non-system role" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public restore(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm }: RestoreRoleQueryDTO,
        @Body() input: RestoreRoleBodyDTO,
    ): Promise<MessageResult> {
        return this.roleCommands.restore({ actor, context, input, realm });
    }

    @HttpCode(OK)
    @Delete("purge")
    @RequirePermission(ROLE_PURGE)
    @FormatResponse(SuccessMessageDTO)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Permanently deletes a revoked non-system role" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public purge(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm, id }: PurgeRoleQueryDTO,
        @Body() input: PurgeRoleBodyDTO,
    ): Promise<MessageResult> {
        return this.roleCommands.purge({ actor, context, input, realm, id });
    }

    @HttpCode(OK)
    @Delete("purge-subtree")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(ROLE_PURGE_SUBTREE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Permanently deletes a role and its entire subtree" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public purgeSubtree(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm, id }: PurgeRoleSubtreeQueryDTO,
        @Body() input: PurgeRoleSubtreeBodyDTO,
    ): Promise<MessageResult> {
        return this.roleCommands.purgeSubtree({ actor, context, input, realm, id });
    }
}
