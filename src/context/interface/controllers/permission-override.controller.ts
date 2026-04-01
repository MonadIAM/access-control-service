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

import { PERMISSION_OVERRIDE_COMMANDS } from "~context/application/commands";
import { PERMISSION_OVERRIDE_QUERIES } from "~context/application/queries";
import { MonitoringInterceptor } from "~common/interceptors";
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
    GetPermissionOverridesListQueryDTO,
    GetPermissionOverridesListBodyDTO,
    GetPermissionOverrideByIdQueryDTO,
    RestorePermissionOverrideQueryDTO,
    RestorePermissionOverrideBodyDTO,
    RevokePermissionOverrideQueryDTO,
    CreatePermissionOverrideQueryDTO,
    RevokePermissionOverrideBodyDTO,
    CreatePermissionOverrideBodyDTO,
    PurgePermissionOverrideQueryDTO,
    PurgePermissionOverrideBodyDTO,
    PermissionOverrideListDTO,
    PermissionOverrideDTO,
} from "../dto/permission-override";

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
        private readonly permissionOverrideCommands: Commands.PermissionOverride.Contract,
        @Inject(PERMISSION_OVERRIDE_QUERIES)
        private readonly permissionOverrideQueries: Queries.PermissionOverride.Contract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(PermissionOverrideDTO)
    @ApiResponse({ status: OK, type: PermissionOverrideDTO })
    @ApiOperation({ summary: "Returns a permission override by identifier" })
    @RequirePermission(PERMISSION_OVERRIDE_READ_ABSOLUTE, PERMISSION_OVERRIDE_READ_PERSONAL)
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, NOT_FOUND, FORBIDDEN)
    public getById(
        @Query() { override, realm, view }: GetPermissionOverrideByIdQueryDTO,
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractPermissions() permissions?: string[],
    ): Promise<Queries.PermissionOverride.Entity> {
        return this.permissionOverrideQueries.findUnique({ permissions, override, realm, actor, view });
    }

    @Post("list")
    @HttpCode(OK)
    @FormatResponse(PermissionOverrideListDTO)
    @ApiResponse({ status: OK, type: PermissionOverrideListDTO })
    @ApiOperation({ summary: "Returns a paginated list of permission overrides" })
    @RequirePermission(PERMISSION_OVERRIDE_READ_ABSOLUTE, PERMISSION_OVERRIDE_READ_PERSONAL)
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN)
    public getList(
        @Body() { pagination, filters, sort }: GetPermissionOverridesListBodyDTO,
        @Query() { realm, view }: GetPermissionOverridesListQueryDTO,
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractPermissions() permissions?: string[],
    ): Promise<[Queries.PermissionOverride.Entity[], number]> {
        return this.permissionOverrideQueries.findMany({ permissions, pagination, filters, realm, actor, sort, view });
    }

    @Post("create")
    @HttpCode(CREATED)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PERMISSION_OVERRIDE_CREATE)
    @ApiResponse({ status: CREATED, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Creates a new permission override" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN, CONFLICT)
    public create(
        @Query() { realm }: CreatePermissionOverrideQueryDTO,
        @ExtractActor() { account: actor }: ActorContext,
        @Body() input: CreatePermissionOverrideBodyDTO,
        @ExtractContext() context: RequestContext,
    ): Promise<MessageResult> {
        return this.permissionOverrideCommands.create({ context, realm, actor, input });
    }

    @HttpCode(OK)
    @Patch("revoke")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PERMISSION_OVERRIDE_REVOKE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Revokes a non-system permission override(s)" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public revoke(
        @Query() { realm }: RevokePermissionOverrideQueryDTO,
        @ExtractActor() { account: actor }: ActorContext,
        @Body() input: RevokePermissionOverrideBodyDTO,
        @ExtractContext() context: RequestContext,
    ): Promise<MessageResult> {
        return this.permissionOverrideCommands.revoke({ context, realm, actor, input });
    }

    @HttpCode(OK)
    @Patch("restore")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PERMISSION_OVERRIDE_RESTORE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Restores a non-system permission override(s)" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public restore(
        @Query() { realm }: RestorePermissionOverrideQueryDTO,
        @ExtractActor() { account: actor }: ActorContext,
        @Body() input: RestorePermissionOverrideBodyDTO,
        @ExtractContext() context: RequestContext,
    ): Promise<MessageResult> {
        return this.permissionOverrideCommands.restore({ context, realm, actor, input });
    }

    @HttpCode(OK)
    @Delete("purge")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PERMISSION_OVERRIDE_PURGE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Permanently deletes a revoked non-system permission override(s)" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public purge(
        @Query() { realm }: PurgePermissionOverrideQueryDTO,
        @ExtractActor() { account: actor }: ActorContext,
        @Body() input: PurgePermissionOverrideBodyDTO,
        @ExtractContext() context: RequestContext,
    ): Promise<MessageResult> {
        return this.permissionOverrideCommands.purge({ context, realm, actor, input });
    }
}
