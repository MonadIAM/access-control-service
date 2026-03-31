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

import { PERMISSION_COMMAND } from "~context/application/command";
import { PERMISSION_QUERY } from "~context/application/query";
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
    GetEffectivePermissionsListQueryDTO,
    GetEffectivePermissionsListBodyDTO,
    GetPermissionsLookupListQueryDTO,
    GetPermissionsLookupListBodyDTO,
    GetPermissionsListQueryDTO,
    GetPermissionByIdQueryDTO,
    GetPermissionsListBodyDTO,
    RestorePermissionQueryDTO,
    RestorePermissionBodyDTO,
    CreatePermissionQueryDTO,
    RevokePermissionQueryDTO,
    UpdatePermissionQueryDTO,
    PurgePermissionQueryDTO,
    RevokePermissionBodyDTO,
    UpdatePermissionBodyDTO,
    CreatePermissionBodyDTO,
    PermissionLookupListDTO,
    PurgePermissionBodyDTO,
    PermissionListDTO,
    PermissionDTO,
} from "../dto/permission";

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
    PERMISSION_READ_PERSONAL,
    PERMISSION_READ_ABSOLUTE,
    PERMISSION_READ_COMMON,
    PERMISSION_RESTORE,
    PERMISSION_CREATE,
    PERMISSION_UPDATE,
    PERMISSION_REVOKE,
    PERMISSION_PURGE,
} = PermissionCode;

@ApiTags("Permission")
@Controller("/permission")
@UseInterceptors(MonitoringInterceptor)
export class PermissionController {
    public constructor(
        @Inject(PERMISSION_COMMAND)
        private readonly permissionCommand: Commands.Permission.Contract,
        @Inject(PERMISSION_QUERY)
        private readonly permissionQuery: Queries.Permission.Contract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(PermissionDTO)
    @RequirePermission(PERMISSION_READ_COMMON)
    @ApiResponse({ status: OK, type: PermissionDTO })
    @ApiOperation({ summary: "Returns a permission by identifier" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, NOT_FOUND, FORBIDDEN)
    public findUnique(
        @Query() { realm, permission, view }: GetPermissionByIdQueryDTO,
    ): Promise<Repositories.Permission.Entity> {
        return this.permissionQuery.findUnique({ permission, realm, view });
    }

    @Post("list")
    @HttpCode(OK)
    @FormatResponse(PermissionListDTO)
    @RequirePermission(PERMISSION_READ_COMMON)
    @ApiResponse({ status: OK, type: PermissionListDTO })
    @ApiOperation({ summary: "Returns a paginated list of permissions" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN)
    public getList(
        @Body() { pagination, filters, sort }: GetPermissionsListBodyDTO,
        @Query() { realm, view }: GetPermissionsListQueryDTO,
    ): Promise<[Repositories.Permission.Entity[], number]> {
        return this.permissionQuery.findMany({ pagination, filters, realm, sort, view });
    }

    @HttpCode(OK)
    @Post("list/effective")
    @FormatResponse(PermissionListDTO)
    @ApiResponse({ status: OK, type: PermissionListDTO })
    @RequirePermission(PERMISSION_READ_ABSOLUTE, PERMISSION_READ_PERSONAL)
    @ApiOperation({ summary: "Returns a paginated list of effective permissions for the account" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN)
    public getEffectiveList(
        @Body() { pagination, filters, sort }: GetEffectivePermissionsListBodyDTO,
        @Query() { account, realm }: GetEffectivePermissionsListQueryDTO,
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractPermissions() permissions?: string[],
    ): Promise<[Repositories.Permission.Entity[], number]> {
        return this.permissionQuery.findEffective({ permissions, pagination, filters, account, realm, actor, sort });
    }

    @HttpCode(OK)
    @Post("list/lookup")
    @FormatResponse(PermissionLookupListDTO)
    @RequirePermission(PERMISSION_READ_COMMON)
    @ApiResponse({ status: OK, type: PermissionLookupListDTO })
    @ApiOperation({ summary: "Returns a lookup list of permissions" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN)
    public getLookupList(
        @Query() { realm, term }: GetPermissionsLookupListQueryDTO,
        @Body() { pagination }: GetPermissionsLookupListBodyDTO,
    ): Promise<[Repositories.Permission.Entity[], number]> {
        return this.permissionQuery.getLookupList({ pagination, realm, term });
    }

    @Post("create")
    @HttpCode(CREATED)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PERMISSION_CREATE)
    @ApiOperation({ summary: "Creates a new permission" })
    @ApiResponse({ status: CREATED, type: SuccessMessageDTO })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN, CONFLICT)
    public create(
        @ExtractActor() { account: actor }: ActorContext,
        @Query() { realm }: CreatePermissionQueryDTO,
        @ExtractContext() context: RequestContext,
        @Body() input: CreatePermissionBodyDTO,
    ): Promise<MessageResult> {
        return this.permissionCommand.create({ context, realm, actor, input });
    }

    @Patch("update")
    @HttpCode(OK)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PERMISSION_UPDATE)
    @ApiOperation({ summary: "Updates permission metadata" })
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public updateMetadata(
        @ExtractActor() { account: actor }: ActorContext,
        @Query() { realm, id }: UpdatePermissionQueryDTO,
        @ExtractContext() context: RequestContext,
        @Body() input: UpdatePermissionBodyDTO,
    ): Promise<MessageResult> {
        return this.permissionCommand.update({ context, realm, actor, input, id });
    }

    @HttpCode(OK)
    @Patch("revoke")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PERMISSION_REVOKE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Revokes a non-system permission(s)" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public revoke(
        @ExtractActor() { account: actor }: ActorContext,
        @Query() { realm }: RevokePermissionQueryDTO,
        @ExtractContext() context: RequestContext,
        @Body() input: RevokePermissionBodyDTO,
    ): Promise<MessageResult> {
        return this.permissionCommand.revoke({ context, realm, actor, input });
    }

    @HttpCode(OK)
    @Patch("restore")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PERMISSION_RESTORE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Restores a non-system permission(s)" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public restore(
        @ExtractActor() { account: actor }: ActorContext,
        @Query() { realm }: RestorePermissionQueryDTO,
        @ExtractContext() context: RequestContext,
        @Body() input: RestorePermissionBodyDTO,
    ): Promise<MessageResult> {
        return this.permissionCommand.restore({ context, realm, actor, input });
    }

    @HttpCode(OK)
    @Delete("purge")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PERMISSION_PURGE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Permanently deletes a revoked non-system permission(s)" })
    @EndpointExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public purge(
        @ExtractActor() { account: actor }: ActorContext,
        @Query() { realm }: PurgePermissionQueryDTO,
        @ExtractContext() context: RequestContext,
        @Body() input: PurgePermissionBodyDTO,
    ): Promise<MessageResult> {
        return this.permissionCommand.purge({ context, realm, actor, input });
    }
}
