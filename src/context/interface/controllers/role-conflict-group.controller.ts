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
import { ROLE_CONFLICT_GROUP_COMMANDS } from "~context/application/commands";
import { ROLE_CONFLICT_GROUP_QUERIES } from "~context/application/queries";
import { MonitoringInterceptor } from "~common/interceptors";
import { SuccessMessageDTO } from "~common/dto";
import { PermissionCode } from "~context/enums";

import {
    RoleConflictGroupDTO,
    GetDetailsQueryDTO,
    GetDetailsBodyDTO,
    GetListQueryDTO,
    GetByIdQueryDTO,
    RestoreQueryDTO,
    GetListBodyDTO,
    RestoreBodyDTO,
    RevokeQueryDTO,
    CreateQueryDTO,
    UpdateQueryDTO,
    UpdateBodyDTO,
    RevokeBodyDTO,
    CreateBodyDTO,
    PurgeQueryDTO,
    PurgeBodyDTO,
    ListDTO,
} from "../dto/role-conflict-group";

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
        @Inject(ROLE_CONFLICT_GROUP_COMMANDS)
        private readonly roleConflictGroupCommands: Commands.RoleConflictGroup.ControllerContract,
        @Inject(ROLE_CONFLICT_GROUP_QUERIES)
        private readonly roleConflictGroupQueries: Queries.RoleConflictGroup.Contract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(RoleConflictGroupDTO)
    @RequirePermission(ROLE_CONFLICT_GROUP_READ_ABSOLUTE)
    @ApiResponse({ status: OK, type: RoleConflictGroupDTO })
    @ApiOperation({
        summary: "Returns a role conflict group by identifier",
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
    public findUnique(@Query() { group, realm, view }: GetByIdQueryDTO): Queries.RoleConflictGroup.FindUnique.Result {
        return this.roleConflictGroupQueries.findUnique({ group, realm, view });
    }

    @Post("list")
    @HttpCode(OK)
    @FormatResponse(ListDTO)
    @RequirePermission(ROLE_CONFLICT_GROUP_READ_ABSOLUTE)
    @ApiResponse({ status: OK, type: ListDTO })
    @ApiOperation({
        summary: "Returns a paginated list of role conflict groups",
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
    ): Queries.RoleConflictGroup.FindMany.Result {
        return this.roleConflictGroupQueries.findMany({ pagination, filters, realm, sort, view });
    }

    @HttpCode(OK)
    @FormatResponse(ListDTO)
    @Post("violation-details")
    @ApiResponse({ status: OK, type: ListDTO })
    @RequirePermission(ROLE_CONFLICT_GROUP_CREATE)
    @ApiOperation({
        summary: "Returns a list of SoD violation details",
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
    public findViolationDetails(
        @Body() { account, roles }: GetDetailsBodyDTO,
        @Query() { realm }: GetDetailsQueryDTO,
    ): Queries.RoleConflictGroup.FindViolationDetails.Result {
        return this.roleConflictGroupQueries.findViolationDetails({ account, realm, roles });
    }

    @Post("create")
    @HttpCode(CREATED)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(ROLE_CONFLICT_GROUP_CREATE)
    @ApiResponse({ status: CREATED, type: SuccessMessageDTO })
    @ApiOperation({
        summary: "Creates a new role conflict group",
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
        return this.roleConflictGroupCommands.create({ context, realm, actor, input });
    }

    @HttpCode(OK)
    @Patch("update")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(ROLE_CONFLICT_GROUP_UPDATE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({
        summary: "Updates role conflict group metadata",
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
        return this.roleConflictGroupCommands.update({ context, realm, actor, input, id });
    }

    @HttpCode(OK)
    @Patch("revoke")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(ROLE_CONFLICT_GROUP_REVOKE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({
        summary: "Revokes a non-system role conflict group(s)",
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
        return this.roleConflictGroupCommands.revoke({ context, realm, actor, input });
    }

    @HttpCode(OK)
    @Patch("restore")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(ROLE_CONFLICT_GROUP_RESTORE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({
        summary: "Restores a non-system role conflict group(s)",
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
        return this.roleConflictGroupCommands.restore({ context, realm, actor, input });
    }

    @HttpCode(OK)
    @Delete("purge")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(ROLE_CONFLICT_GROUP_PURGE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({
        summary: "Permanently deletes a revoked non-system role conflict group(s)",
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
        return this.roleConflictGroupCommands.purge({ context, realm, actor, input });
    }
}
