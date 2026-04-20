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
import { ROLE_COMMANDS } from "~context/application/commands";
import { MonitoringInterceptor } from "~common/interceptors";
import { ROLE_QUERIES } from "~context/application/queries";
import { SuccessMessageDTO } from "~common/dto";
import { PermissionCode } from "~context/enums";

import {
    GetDescendantsListQueryDTO,
    GetDescendantsListBodyDTO,
    GetHierarchyGraphQueryDTO,
    GetEffectiveListQueryDTO,
    GetAncestorsListQueryDTO,
    GetDelegableListQueryDTO,
    GetDelegableListBodyDTO,
    GetEffectiveListBodyDTO,
    GetAncestorsListBodyDTO,
    RoleHierarchyGraphDTO,
    GetLookupListQueryDTO,
    GetLookupListBodyDTO,
    PurgeSubtreeQueryDTO,
    PurgeSubtreeBodyDTO,
    HierarchyListDTO,
    GetListQueryDTO,
    RestoreQueryDTO,
    GetByIdQueryDTO,
    GetListBodyDTO,
    CreateQueryDTO,
    RevokeQueryDTO,
    UpdateQueryDTO,
    RestoreBodyDTO,
    CreateBodyDTO,
    RevokeBodyDTO,
    UpdateBodyDTO,
    PurgeQueryDTO,
    LookupListDTO,
    PurgeBodyDTO,
    ListDTO,
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
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, NOT_FOUND, FORBIDDEN)
    public findUnique(@Query() { realm, role, view }: GetByIdQueryDTO): Promise<Queries.Role.Entity> {
        return this.roleQueries.findUnique({ realm, role, view });
    }

    @HttpCode(OK)
    @Post("list")
    @FormatResponse(ListDTO)
    @RequirePermission(ROLE_READ_COMMON)
    @ApiResponse({ status: OK, type: ListDTO })
    @ApiOperation({ summary: "Returns a paginated list of roles" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN)
    public findMany(
        @Query() { realm, view }: GetListQueryDTO,
        @Body() { pagination, filters, sort }: GetListBodyDTO,
    ): Promise<[Queries.Role.Entity[], number]> {
        return this.roleQueries.findMany({ pagination, filters, realm, sort, view });
    }

    @HttpCode(OK)
    @Post("list/ancestors")
    @RequirePermission(ROLE_READ_COMMON)
    @FormatResponse(HierarchyListDTO)
    @ApiResponse({ status: OK, type: HierarchyListDTO })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN)
    @ApiOperation({ summary: "Returns a paginated list of ancestor roles of the specified role, including itself" })
    public findAncestors(
        @Query() { descendant, realm, view }: GetAncestorsListQueryDTO,
        @Body() { pagination, filters }: GetAncestorsListBodyDTO,
    ): Promise<[Queries.Role.DepthEntity[], number]> {
        return this.roleQueries.findAncestors({ descendant, pagination, filters, realm, view });
    }

    @HttpCode(OK)
    @Post("list/descendants")
    @RequirePermission(ROLE_READ_COMMON)
    @FormatResponse(HierarchyListDTO)
    @ApiResponse({ status: OK, type: HierarchyListDTO })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN)
    @ApiOperation({ summary: "Returns a paginated list of descendant roles of the specified role, including itself" })
    public findDescendants(
        @Query() { ancestor, realm, view }: GetDescendantsListQueryDTO,
        @Body() { pagination, filters }: GetDescendantsListBodyDTO,
    ): Promise<[Queries.Role.DepthEntity[], number]> {
        return this.roleQueries.findDescendants({ pagination, ancestor, filters, realm, view });
    }

    @HttpCode(OK)
    @FormatResponse(ListDTO)
    @Post("list/delegable/by-account")
    @ApiResponse({ status: OK, type: ListDTO })
    @RequirePermission(ROLE_READ_PERSONAL, ROLE_READ_ABSOLUTE)
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN)
    @ApiOperation({ summary: "Returns a paginated list of roles that can be delegated by the specified account" })
    public findDelegableByAccount(
        @Body() { pagination, filters, sort }: GetDelegableListBodyDTO,
        @Query() { realm, id }: GetDelegableListQueryDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Permissions() permissions?: string[],
    ): Promise<[Queries.Role.Entity[], number]> {
        return this.roleQueries.findDelegableByAccount({ permissions, pagination, filters, sort, realm, actor, id });
    }

    @HttpCode(OK)
    @FormatResponse(ListDTO)
    @Post("list/delegable/by-role")
    @RequirePermission(ROLE_READ_COMMON)
    @ApiResponse({ status: OK, type: ListDTO })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN)
    @ApiOperation({ summary: "Returns a paginated list of roles that can be delegated from the specified role" })
    public findDelegableByRole(
        @Body() { pagination, filters, sort }: GetDelegableListBodyDTO,
        @Query() { realm, id }: GetDelegableListQueryDTO,
    ): Promise<[Queries.Role.Entity[], number]> {
        return this.roleQueries.findDelegableByRole({ pagination, filters, sort, realm, id });
    }

    @HttpCode(OK)
    @Post("list/effective")
    @FormatResponse(ListDTO)
    @ApiResponse({ status: OK, type: ListDTO })
    @RequirePermission(ROLE_READ_PERSONAL, ROLE_READ_ABSOLUTE)
    @ApiOperation({ summary: "Returns a paginated list of effective roles for the account" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN)
    public findEffective(
        @Body() { pagination, filters, sort }: GetEffectiveListBodyDTO,
        @Query() { realm, account }: GetEffectiveListQueryDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Permissions() permissions?: string[],
    ): Promise<[Queries.Role.Entity[], number]> {
        return this.roleQueries.findEffective({ permissions, pagination, filters, sort, account, actor, realm });
    }

    @HttpCode(OK)
    @Post("list/lookup")
    @FormatResponse(LookupListDTO)
    @RequirePermission(ROLE_READ_COMMON)
    @ApiResponse({ status: OK, type: LookupListDTO })
    @ApiOperation({ summary: "Returns a lookup list of roles" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN)
    public getLookupList(
        @Query() { realm, term }: GetLookupListQueryDTO,
        @Body() { pagination }: GetLookupListBodyDTO,
    ): Promise<[Queries.Role.Entity[], number]> {
        return this.roleQueries.getLookupList({ pagination, realm, term });
    }

    @HttpCode(OK)
    @Get("hierarchy-graph")
    @RequirePermission(ROLE_READ_COMMON)
    @FormatResponse(RoleHierarchyGraphDTO)
    @ApiResponse({ status: OK, type: RoleHierarchyGraphDTO })
    @ApiOperation({ summary: "Returns the role hierarchy graph (nodes and edges)" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN)
    public getHierarchyGraph(@Query() { realm }: GetHierarchyGraphQueryDTO): Promise<Queries.Role.Graph> {
        return this.roleQueries.getHierarchyGraph({ realm });
    }

    @Post("create")
    @HttpCode(CREATED)
    @RequirePermission(ROLE_CREATE)
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Creates a new role" })
    @ApiResponse({ status: CREATED, type: SuccessMessageDTO })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN, CONFLICT)
    public create(
        @Query() { realm }: CreateQueryDTO,
        @Body() input: CreateBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Promise<MessageResult> {
        return this.roleCommands.create({ actor, context, input, realm });
    }

    @HttpCode(OK)
    @Patch("update")
    @RequirePermission(ROLE_UPDATE)
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Updates role metadata" })
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public updateMetadata(
        @Query() { realm, id }: UpdateQueryDTO,
        @Body() input: UpdateBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Promise<MessageResult> {
        return this.roleCommands.update({ actor, context, input, realm, id });
    }

    @HttpCode(OK)
    @Patch("revoke")
    @RequirePermission(ROLE_REVOKE)
    @FormatResponse(SuccessMessageDTO)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Revokes a non-system role" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public revoke(
        @Query() { realm }: RevokeQueryDTO,
        @Body() input: RevokeBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Promise<MessageResult> {
        return this.roleCommands.revoke({ actor, context, input, realm });
    }

    @HttpCode(OK)
    @Patch("restore")
    @RequirePermission(ROLE_RESTORE)
    @FormatResponse(SuccessMessageDTO)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Restores a non-system role" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public restore(
        @Query() { realm }: RestoreQueryDTO,
        @Body() input: RestoreBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Promise<MessageResult> {
        return this.roleCommands.restore({ actor, context, input, realm });
    }

    @HttpCode(OK)
    @Delete("purge")
    @RequirePermission(ROLE_PURGE)
    @FormatResponse(SuccessMessageDTO)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Permanently deletes a revoked non-system role" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public purge(
        @Query() { realm, id }: PurgeQueryDTO,
        @Body() input: PurgeBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Promise<MessageResult> {
        return this.roleCommands.purge({ actor, context, input, realm, id });
    }

    @HttpCode(OK)
    @Delete("purge-subtree")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(ROLE_PURGE_SUBTREE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Permanently deletes a role and its entire subtree" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public purgeSubtree(
        @Query() { realm, id }: PurgeSubtreeQueryDTO,
        @Body() input: PurgeSubtreeBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Promise<MessageResult> {
        return this.roleCommands.purgeSubtree({ actor, context, input, realm, id });
    }
}
