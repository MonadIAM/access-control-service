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
import { PERMISSION_COMMANDS } from "~context/application/commands";
import { PERMISSION_QUERIES } from "~context/application/queries";
import { MonitoringInterceptor } from "~common/interceptors";
import { SuccessMessageDTO } from "~common/dto";
import { PermissionCode } from "~context/enums";

import {
    GetEffectiveListQueryDTO,
    GetEffectiveListBodyDTO,
    GetLookupListQueryDTO,
    GetLookupListBodyDTO,
    GetListQueryDTO,
    GetByIdQueryDTO,
    RestoreQueryDTO,
    GetListBodyDTO,
    RestoreBodyDTO,
    CreateQueryDTO,
    RevokeQueryDTO,
    UpdateQueryDTO,
    PurgeQueryDTO,
    RevokeBodyDTO,
    UpdateBodyDTO,
    CreateBodyDTO,
    LookupListDTO,
    PermissionDTO,
    PurgeBodyDTO,
    ListDTO,
} from "../dto/permission";

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
    PERMISSION_READ_ABSOLUTE,
    PERMISSION_READ_PERSONAL,
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
        @Inject(PERMISSION_COMMANDS)
        private readonly permissionCommands: Commands.Permission.ControllerContract,
        @Inject(PERMISSION_QUERIES)
        private readonly permissionQueries: Queries.Permission.Contract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(PermissionDTO)
    @ApiResponse({ status: OK, type: PermissionDTO })
    @RequirePermission(PERMISSION_READ_ABSOLUTE, PERMISSION_READ_COMMON)
    @ApiOperation({
        summary: "Returns a permission by identifier",
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
    public findUnique(@Query() { realm, permission, view }: GetByIdQueryDTO): Queries.Permission.FindUnique.Result {
        return this.permissionQueries.findUnique({ permission, realm, view });
    }

    @Post("list")
    @HttpCode(OK)
    @FormatResponse(ListDTO)
    @ApiResponse({ status: OK, type: ListDTO })
    @RequirePermission(PERMISSION_READ_ABSOLUTE, PERMISSION_READ_COMMON)
    @ApiOperation({
        summary: "Returns a paginated list of permissions",
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
        @Query() { realm, view, mode }: GetListQueryDTO,
    ): Queries.Permission.FindMany.Result {
        return this.permissionQueries.findMany({ mode, pagination, filters, realm, sort, view });
    }

    @HttpCode(OK)
    @Post("list/lookup")
    @FormatResponse(LookupListDTO)
    @ApiResponse({ status: OK, type: LookupListDTO })
    @RequirePermission(PERMISSION_READ_ABSOLUTE, PERMISSION_READ_COMMON)
    @ApiOperation({
        summary: "Returns a lookup list of permissions",
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
    ): Queries.Permission.GetLookupList.Result {
        return this.permissionQueries.getLookupList({ mode, pagination, realm, term });
    }

    @HttpCode(OK)
    @Post("list/effective")
    @FormatResponse(ListDTO)
    @ApiResponse({ status: OK, type: ListDTO })
    @RequirePermission(PERMISSION_READ_PERSONAL)
    @ApiOperation({
        summary: "Returns a paginated list of effective permissions for the account",
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
    public getEffectiveList(
        @Body() { pagination, filters, sort }: GetEffectiveListBodyDTO,
        @Query() { realm, mode }: GetEffectiveListQueryDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
    ): Queries.Permission.FindEffective.Result {
        return this.permissionQueries.findEffective({ mode, pagination, filters, realm, actor, sort });
    }

    @Post("create")
    @HttpCode(CREATED)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PERMISSION_CREATE)
    @ApiResponse({ status: CREATED, type: SuccessMessageDTO })
    @ApiOperation({
        summary: "Creates a new permission",
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
        return this.permissionCommands.create({ context, realm, actor, input });
    }

    @HttpCode(OK)
    @Patch("update")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PERMISSION_UPDATE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({
        summary: "Updates permission metadata",
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
        return this.permissionCommands.update({ context, realm, actor, input, id });
    }

    @HttpCode(OK)
    @Patch("revoke")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PERMISSION_REVOKE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({
        summary: "Revokes a non-system permission(s)",
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
        return this.permissionCommands.revoke({ context, realm, actor, input });
    }

    @HttpCode(OK)
    @Patch("restore")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PERMISSION_RESTORE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({
        summary: "Restores a non-system permission(s)",
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
        return this.permissionCommands.restore({ context, realm, actor, input });
    }

    @HttpCode(OK)
    @Delete("purge")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PERMISSION_PURGE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({
        summary: "Permanently deletes a revoked non-system permission(s)",
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
        return this.permissionCommands.purge({ context, realm, actor, input });
    }
}
