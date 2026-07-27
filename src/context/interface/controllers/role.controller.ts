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
import { MonitoringInterceptor } from "~common/interceptors";
import { SuccessMessageDTO } from "~common/dto";
import { PermissionCode } from "~context/enums";

import { ROLE_COMMANDS } from "../commands";
import { ROLE_QUERIES } from "../queries";
import {
    GetDelegableByAccountListQueryDTO,
    GetDelegableByAccountListBodyDTO,
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
    MoveQueryDTO,
    MoveBodyDTO,
    ListDTO,
    RoleDTO,
} from "../dto/role";

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
    ROLE_HIERARCHY_UPDATE,
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
        private readonly roleCommands: Commands.Role.ControllerContract,
        @Inject(ROLE_QUERIES)
        private readonly roleQueries: Queries.Role.Contract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(RoleDTO)
    @RequirePermission(ROLE_READ_ABSOLUTE, ROLE_READ_COMMON)
    @ApiResponse({ status: OK, type: RoleDTO })
    @ApiOperation({
        summary: "Returns a role by identifier",
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
    public findUnique(@Query() { realm, role, view }: GetByIdQueryDTO): Queries.Role.FindUnique.Result {
        return this.roleQueries.findUnique({ realm, role, view });
    }

    @HttpCode(OK)
    @Post("list")
    @FormatResponse(ListDTO)
    @ApiResponse({ status: OK, type: ListDTO })
    @RequirePermission(ROLE_READ_ABSOLUTE, ROLE_READ_COMMON)
    @ApiOperation({
        summary: "Returns a paginated list of roles",
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
        @Query() { realm, view, mode }: GetListQueryDTO,
        @Body() { pagination, filters, sort }: GetListBodyDTO,
    ): Queries.Role.FindMany.Result {
        return this.roleQueries.findMany({ mode, pagination, filters, realm, sort, view });
    }

    @HttpCode(OK)
    @Post("list/ancestors")
    @FormatResponse(HierarchyListDTO)
    @ApiResponse({ status: OK, type: HierarchyListDTO })
    @RequirePermission(ROLE_READ_ABSOLUTE, ROLE_READ_COMMON)
    @ApiOperation({
        summary: "Returns a paginated list of ancestor roles of the specified role, including itself",
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
    public findAncestors(
        @Query() { descendant, realm, view }: GetAncestorsListQueryDTO,
        @Body() { pagination, filters }: GetAncestorsListBodyDTO,
    ): Queries.Role.FindAncestors.Result {
        return this.roleQueries.findAncestors({ descendant, pagination, filters, realm, view });
    }

    @HttpCode(OK)
    @Post("list/descendants")
    @FormatResponse(HierarchyListDTO)
    @ApiResponse({ status: OK, type: HierarchyListDTO })
    @RequirePermission(ROLE_READ_ABSOLUTE, ROLE_READ_COMMON)
    @ApiOperation({
        summary: "Returns a paginated list of descendant roles of the specified role, including itself",
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
    public findDescendants(
        @Query() { ancestor, realm, view }: GetDescendantsListQueryDTO,
        @Body() { pagination, filters }: GetDescendantsListBodyDTO,
    ): Queries.Role.FindDescendants.Result {
        return this.roleQueries.findDescendants({ pagination, ancestor, filters, realm, view });
    }

    @HttpCode(OK)
    @FormatResponse(ListDTO)
    @Post("list/delegable/by-role")
    @ApiResponse({ status: OK, type: ListDTO })
    @RequirePermission(ROLE_READ_ABSOLUTE, ROLE_READ_COMMON)
    @ApiOperation({
        summary: "Returns a paginated list of roles that can be delegated from the specified role",
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
    public findDelegableByRole(
        @Body() { pagination, filters, sort }: GetDelegableListBodyDTO,
        @Query() { realm, id }: GetDelegableListQueryDTO,
    ): Queries.Role.FindDelegableByRole.Result {
        return this.roleQueries.findDelegableByRole({ pagination, filters, sort, realm, id });
    }

    @HttpCode(OK)
    @Post("list/lookup")
    @FormatResponse(LookupListDTO)
    @ApiResponse({ status: OK, type: LookupListDTO })
    @RequirePermission(ROLE_READ_ABSOLUTE, ROLE_READ_COMMON)
    @ApiOperation({
        summary: "Returns a lookup list of roles",
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
    public getLookupList(
        @Query() { realm, term, mode }: GetLookupListQueryDTO,
        @Body() { pagination }: GetLookupListBodyDTO,
    ): Queries.Role.GetLookupList.Result {
        return this.roleQueries.getLookupList({ mode, pagination, realm, term });
    }

    @HttpCode(OK)
    @Get("hierarchy-graph")
    @FormatResponse(RoleHierarchyGraphDTO)
    @RequirePermission(ROLE_READ_ABSOLUTE, ROLE_READ_COMMON)
    @ApiResponse({ status: OK, type: RoleHierarchyGraphDTO })
    @ApiOperation({
        summary: "Returns the role hierarchy graph (nodes and edges)",
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
    public getHierarchyGraph(@Query() { realm }: GetHierarchyGraphQueryDTO): Promise<Queries.Role.Graph> {
        return this.roleQueries.getHierarchyGraph({ realm });
    }

    @HttpCode(OK)
    @FormatResponse(ListDTO)
    @Post("list/delegable/by-account")
    @RequirePermission(ROLE_READ_PERSONAL)
    @ApiResponse({ status: OK, type: ListDTO })
    @ApiOperation({
        summary: "Returns a paginated list of roles that can be delegated by the current account",
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
    public findDelegableByAccount(
        @Body() { pagination, filters, sort }: GetDelegableByAccountListBodyDTO,
        @Query() { realm, mode }: GetDelegableByAccountListQueryDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
    ): Queries.Role.FindDelegableByAccount.Result {
        return this.roleQueries.findDelegableByAccount({ mode, pagination, filters, sort, realm, actor });
    }

    @HttpCode(OK)
    @Post("list/effective")
    @FormatResponse(ListDTO)
    @RequirePermission(ROLE_READ_PERSONAL)
    @ApiResponse({ status: OK, type: ListDTO })
    @ApiOperation({
        summary: "Returns a paginated list of effective roles for the current account",
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
    public findEffective(
        @Body() { pagination, filters, sort }: GetEffectiveListBodyDTO,
        @Query() { realm, mode }: GetEffectiveListQueryDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
    ): Queries.Role.FindEffective.Result {
        return this.roleQueries.findEffective({ mode, pagination, filters, sort, actor, realm });
    }

    @Post("create")
    @HttpCode(CREATED)
    @RequirePermission(ROLE_CREATE)
    @FormatResponse(SuccessMessageDTO)
    @ApiResponse({ status: CREATED, type: SuccessMessageDTO })
    @ApiOperation({
        summary: "Creates a new role",
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
        return this.roleCommands.create({ actor, context, input, realm });
    }

    @HttpCode(OK)
    @Patch("update")
    @RequirePermission(ROLE_UPDATE)
    @FormatResponse(SuccessMessageDTO)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({
        summary: "Updates role metadata",
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
    @ApiOperation({
        summary: "Revokes a non-system role",
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
        return this.roleCommands.revoke({ actor, context, input, realm });
    }

    @HttpCode(OK)
    @Patch("restore")
    @RequirePermission(ROLE_RESTORE)
    @FormatResponse(SuccessMessageDTO)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({
        summary: "Restores a non-system role",
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
        return this.roleCommands.restore({ actor, context, input, realm });
    }

    @HttpCode(OK)
    @Patch("move")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(ROLE_HIERARCHY_UPDATE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({
        summary: "Move a non-system role/subtree within the hierarchy",
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
    public move(
        @Query() { realm }: MoveQueryDTO,
        @Body() input: MoveBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Promise<MessageResult> {
        return this.roleCommands.move({ actor, context, input, realm });
    }

    @HttpCode(OK)
    @Delete("purge")
    @RequirePermission(ROLE_PURGE)
    @FormatResponse(SuccessMessageDTO)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({
        summary: "Permanently deletes a revoked non-system role",
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
    @ApiOperation({
        summary: "Permanently deletes a role and its entire subtree",
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
    public purgeSubtree(
        @Query() { realm, id }: PurgeSubtreeQueryDTO,
        @Body() input: PurgeSubtreeBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Promise<MessageResult> {
        return this.roleCommands.purgeSubtree({ actor, context, input, realm, id });
    }
}
