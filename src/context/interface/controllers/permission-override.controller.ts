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
import { PERMISSION_OVERRIDE_COMMANDS } from "~context/application/commands";
import { PERMISSION_OVERRIDE_QUERIES } from "~context/application/queries";
import { MonitoringInterceptor } from "~common/interceptors";
import { SuccessMessageDTO } from "~common/dto";
import { PermissionCode } from "~context/enums";

import {
    PermissionOverrideDTO,
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
} from "../dto/permission-override";

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
    PERMISSION_OVERRIDE_READ_ABSOLUTE,
    PERMISSION_OVERRIDE_READ_PERSONAL,
    PERMISSION_OVERRIDE_RESTORE,
    PERMISSION_OVERRIDE_CREATE,
    PERMISSION_OVERRIDE_REVOKE,
    PERMISSION_OVERRIDE_PURGE,
} = PermissionCode;

@ApiTags("PermissionOverride")
@Controller("/permission-override")
@UseInterceptors(MonitoringInterceptor)
export class PermissionOverrideController {
    public constructor(
        @Inject(PERMISSION_OVERRIDE_COMMANDS)
        private readonly permissionOverrideCommands: Commands.PermissionOverride.ControllerContract,
        @Inject(PERMISSION_OVERRIDE_QUERIES)
        private readonly permissionOverrideQueries: Queries.PermissionOverride.Contract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(PermissionOverrideDTO)
    @ApiResponse({ status: OK, type: PermissionOverrideDTO })
    @RequirePermission(PERMISSION_OVERRIDE_READ_ABSOLUTE, PERMISSION_OVERRIDE_READ_PERSONAL)
    @ApiOperation({
        summary: "Returns a permission override by identifier",
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
    public getById(
        @Query() { override, realm, view }: GetByIdQueryDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Permissions() permissions?: string[],
    ): Queries.PermissionOverride.FindUnique.Result {
        return this.permissionOverrideQueries.findUnique({ permissions, override, realm, actor, view });
    }

    @Post("list")
    @HttpCode(OK)
    @FormatResponse(ListDTO)
    @ApiResponse({ status: OK, type: ListDTO })
    @RequirePermission(PERMISSION_OVERRIDE_READ_ABSOLUTE, PERMISSION_OVERRIDE_READ_PERSONAL)
    @ApiOperation({
        summary: "Returns a paginated list of permission overrides",
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
    public getList(
        @Body() { pagination, filters, sort }: GetListBodyDTO,
        @Query() { realm, view }: GetListQueryDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Permissions() permissions?: string[],
    ): Queries.PermissionOverride.FindMany.Result {
        return this.permissionOverrideQueries.findMany({ permissions, pagination, filters, realm, actor, sort, view });
    }

    @Post("create")
    @HttpCode(CREATED)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PERMISSION_OVERRIDE_CREATE)
    @ApiResponse({ status: CREATED, type: SuccessMessageDTO })
    @ApiOperation({
        summary: "Creates a new permission override",
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
        return this.permissionOverrideCommands.create({ context, realm, actor, input });
    }

    @HttpCode(OK)
    @Patch("revoke")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PERMISSION_OVERRIDE_REVOKE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({
        summary: "Revokes a non-system permission override(s)",
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
        return this.permissionOverrideCommands.revoke({ context, realm, actor, input });
    }

    @HttpCode(OK)
    @Patch("restore")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PERMISSION_OVERRIDE_RESTORE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({
        summary: "Restores a non-system permission override(s)",
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
        return this.permissionOverrideCommands.restore({ context, realm, actor, input });
    }

    @HttpCode(OK)
    @Delete("purge")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PERMISSION_OVERRIDE_PURGE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({
        summary: "Permanently deletes a revoked non-system permission override(s)",
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
        return this.permissionOverrideCommands.purge({ context, realm, actor, input });
    }
}
