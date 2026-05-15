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
        @Inject(PERMISSION_COMMANDS)
        private readonly permissionCommands: Commands.Permission.ControllerContract,
        @Inject(PERMISSION_QUERIES)
        private readonly permissionQueries: Queries.Permission.Contract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(PermissionDTO)
    @RequirePermission(PERMISSION_READ_COMMON)
    @ApiResponse({ status: OK, type: PermissionDTO })
    @ApiOperation({ summary: "Returns a permission by identifier" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, NOT_FOUND, FORBIDDEN)
    public findUnique(@Query() { realm, permission, view }: GetByIdQueryDTO): Promise<Queries.Permission.Entity> {
        return this.permissionQueries.findUnique({ permission, realm, view });
    }

    @Post("list")
    @HttpCode(OK)
    @FormatResponse(ListDTO)
    @RequirePermission(PERMISSION_READ_COMMON)
    @ApiResponse({ status: OK, type: ListDTO })
    @ApiOperation({ summary: "Returns a paginated list of permissions" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN)
    public getList(
        @Body() { pagination, filters, sort }: GetListBodyDTO,
        @Query() { realm, view }: GetListQueryDTO,
    ): Promise<[Queries.Permission.Entity[], number]> {
        return this.permissionQueries.findMany({ pagination, filters, realm, sort, view });
    }

    @HttpCode(OK)
    @Post("list/effective")
    @FormatResponse(ListDTO)
    @ApiResponse({ status: OK, type: ListDTO })
    @RequirePermission(PERMISSION_READ_ABSOLUTE, PERMISSION_READ_PERSONAL)
    @ApiOperation({ summary: "Returns a paginated list of effective permissions for the account" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN)
    public getEffectiveList(
        @Body() { pagination, filters, sort }: GetEffectiveListBodyDTO,
        @Query() { account, realm }: GetEffectiveListQueryDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Permissions() permissions?: string[],
    ): Promise<[Queries.Permission.Entity[], number]> {
        return this.permissionQueries.findEffective({ permissions, pagination, filters, account, realm, actor, sort });
    }

    @HttpCode(OK)
    @Post("list/lookup")
    @FormatResponse(LookupListDTO)
    @RequirePermission(PERMISSION_READ_COMMON)
    @ApiResponse({ status: OK, type: LookupListDTO })
    @ApiOperation({ summary: "Returns a lookup list of permissions" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN)
    public getLookupList(
        @Query() { realm, term }: GetLookupListQueryDTO,
        @Body() { pagination }: GetLookupListBodyDTO,
    ): Promise<[Queries.Permission.Entity[], number]> {
        return this.permissionQueries.getLookupList({ pagination, realm, term });
    }

    @Post("create")
    @HttpCode(CREATED)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PERMISSION_CREATE)
    @ApiOperation({ summary: "Creates a new permission" })
    @ApiResponse({ status: CREATED, type: SuccessMessageDTO })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN, CONFLICT)
    public create(
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Query() { realm }: CreateQueryDTO,
        @Extract.Meta() context: Extract.Meta,
        @Body() input: CreateBodyDTO,
    ): Promise<MessageResult> {
        return this.permissionCommands.create({ context, realm, actor, input });
    }

    @Patch("update")
    @HttpCode(OK)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PERMISSION_UPDATE)
    @ApiOperation({ summary: "Updates permission metadata" })
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public updateMetadata(
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Query() { realm, id }: UpdateQueryDTO,
        @Extract.Meta() context: Extract.Meta,
        @Body() input: UpdateBodyDTO,
    ): Promise<MessageResult> {
        return this.permissionCommands.update({ context, realm, actor, input, id });
    }

    @HttpCode(OK)
    @Patch("revoke")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PERMISSION_REVOKE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Revokes a non-system permission(s)" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public revoke(
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Query() { realm }: RevokeQueryDTO,
        @Extract.Meta() context: Extract.Meta,
        @Body() input: RevokeBodyDTO,
    ): Promise<MessageResult> {
        return this.permissionCommands.revoke({ context, realm, actor, input });
    }

    @HttpCode(OK)
    @Patch("restore")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PERMISSION_RESTORE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Restores a non-system permission(s)" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public restore(
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Query() { realm }: RestoreQueryDTO,
        @Extract.Meta() context: Extract.Meta,
        @Body() input: RestoreBodyDTO,
    ): Promise<MessageResult> {
        return this.permissionCommands.restore({ context, realm, actor, input });
    }

    @HttpCode(OK)
    @Delete("purge")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PERMISSION_PURGE)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({ summary: "Permanently deletes a revoked non-system permission(s)" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN)
    public purge(
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Query() { realm }: PurgeQueryDTO,
        @Extract.Meta() context: Extract.Meta,
        @Body() input: PurgeBodyDTO,
    ): Promise<MessageResult> {
        return this.permissionCommands.purge({ context, realm, actor, input });
    }
}
