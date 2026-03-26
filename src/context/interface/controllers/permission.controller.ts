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
import { PERMISSION_REPOSITORY } from "~context/infrastructure/repositories";
import { PERMISSION_OPERATION } from "~context/application/operations";
import { MonitoringInterceptor } from "~common/interceptors";
import { SuccessMessageDTO } from "~common/dto";
import { PermissionCode } from "~context/enums";

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

@ApiTags("Permission")
@Controller("/permission")
@UseInterceptors(MonitoringInterceptor)
export class PermissionController {
    private readonly populate = {
        DETAILED: ["realm"] as const,
        COMPACT: [] as const,
    };

    public constructor(
        @Inject(PERMISSION_REPOSITORY)
        private readonly permissionRepository: Repositories.Permission.Contract,
        @Inject(PERMISSION_OPERATION)
        private readonly permissionOperation: Operations.Permission.Contract,
    ) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    @FormatResponse(PermissionDTO)
    @RequirePermission(PermissionCode.PERMISSION_READ)
    @ApiOperation({ summary: "Returns a permission by identifier" })
    @ApiResponse({ status: HttpStatus.OK, type: PermissionDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.NOT_FOUND)
    public getById(
        @Query() { realm, permission, view }: GetPermissionByIdQueryDTO,
    ): Promise<Repositories.Permission.Entity> {
        return this.permissionRepository.findUniqueOrThrow({
            options: { populate: this.populate[view] },
            where: { id: permission, realm },
        });
    }

    @Post("list")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(PermissionListDTO)
    @RequirePermission(PermissionCode.PERMISSION_READ)
    @ApiOperation({ summary: "Returns a paginated list of permissions" })
    @ApiResponse({ status: HttpStatus.OK, type: PermissionListDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY)
    public getList(
        @Query() { realm, view }: GetPermissionsListQueryDTO,
        @Body() { pagination, filters, sort }: GetPermissionsListBodyDTO,
    ): Promise<[Repositories.Permission.Entity[], number]> {
        return this.permissionRepository.findMany({
            options: { populate: this.populate[view] },
            pagination,
            filters,
            realm,
            sort,
        });
    }

    @Post("list/lookup")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(PermissionLookupListDTO)
    @RequirePermission(PermissionCode.PERMISSION_READ)
    @ApiOperation({ summary: "Returns a lookup list of permissions" })
    @ApiResponse({ status: HttpStatus.OK, type: PermissionLookupListDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY)
    public getLookupList(
        @Query() { realm, term }: GetPermissionsLookupListQueryDTO,
        @Body() { pagination }: GetPermissionsLookupListBodyDTO,
    ): Promise<[Repositories.Permission.Entity[], number]> {
        return this.permissionRepository.getLookupList({ pagination, realm, term });
    }

    @Post("list/effective")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(PermissionListDTO)
    @RequirePermission(PermissionCode.PERMISSION_READ)
    @ApiOperation({ summary: "Returns a paginated list of effective permissions for the account" })
    @ApiResponse({ status: HttpStatus.OK, type: PermissionListDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY)
    public getEffectiveList(
        @Query() { account, realm }: GetEffectivePermissionsListQueryDTO,
        @Body() { pagination, filters, sort }: GetEffectivePermissionsListBodyDTO,
    ): Promise<[Repositories.Permission.Entity[], number]> {
        return this.permissionRepository.findEffectivePermissions({ where: { account, realm }, pagination, filters, sort });
    }

    @Post("create")
    @HttpCode(HttpStatus.CREATED)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PermissionCode.PERMISSION_CREATE)
    @ApiOperation({ summary: "Creates a new permission" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(
        HttpStatus.INTERNAL_SERVER_ERROR,
        HttpStatus.UNPROCESSABLE_ENTITY,
        HttpStatus.BAD_REQUEST,
        HttpStatus.CONFLICT,
    )
    public create(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm }: CreatePermissionQueryDTO,
        @Body() input: CreatePermissionBodyDTO,
    ): Promise<MessageResult> {
        return this.permissionOperation.create({ actor, context, input, realm });
    }

    @Patch("update")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PermissionCode.PERMISSION_UPDATE)
    @ApiOperation({ summary: "Updates permission metadata" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public updateMetadata(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm, id }: UpdatePermissionQueryDTO,
        @Body() input: UpdatePermissionBodyDTO,
    ): Promise<MessageResult> {
        return this.permissionOperation.update({ actor, context, input, realm, id });
    }

    @Patch("revoke")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PermissionCode.PERMISSION_REVOKE)
    @ApiOperation({ summary: "Revokes a non-system permission/s" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public revoke(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm }: RevokePermissionQueryDTO,
        @Body() input: RevokePermissionBodyDTO,
    ): Promise<MessageResult> {
        return this.permissionOperation.revoke({ actor, context, input, realm });
    }

    @Patch("restore")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PermissionCode.PERMISSION_RESTORE)
    @ApiOperation({ summary: "Restores a non-system permission/s" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public restore(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm }: RestorePermissionQueryDTO,
        @Body() input: RestorePermissionBodyDTO,
    ): Promise<MessageResult> {
        return this.permissionOperation.restore({ actor, context, input, realm });
    }

    @Delete("purge")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PermissionCode.PERMISSION_PURGE)
    @ApiOperation({ summary: "Permanently deletes a revoked non-system permission/s" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public purge(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm }: PurgePermissionQueryDTO,
        @Body() input: PurgePermissionBodyDTO,
    ): Promise<MessageResult> {
        return this.permissionOperation.purge({ actor, context, input, realm });
    }
}
