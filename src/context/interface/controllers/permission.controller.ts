import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { I18nLang as Lang, I18nService } from "nestjs-i18n";
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

import { EndpointExceptions, ExtractActor, ExtractContext, RequirePermission } from "~common/decorators";
import { PERMISSION_REPOSITORY } from "~context/infrastructure/repositories";
import { PERMISSION_OPERATION } from "~context/application/operations";
import { MonitoringInterceptor } from "~common/interceptors";
import { BaseController } from "~common/abstract";
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
export class PermissionController extends BaseController {
    private readonly populate = {
        DETAILED: ["realm"] as const,
        COMPACT: [] as const,
    };

    public constructor(
        @Inject(PERMISSION_REPOSITORY)
        private readonly permissionRepository: Repositories.Permission.Contract,
        @Inject(PERMISSION_OPERATION)
        private readonly permissionOperation: Operations.Permission.Contract,
        i18nService: I18nService,
    ) {
        super(i18nService);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @RequirePermission(PermissionCode.PERMISSION_READ)
    @ApiOperation({ summary: "Returns a permission by identifier" })
    @ApiResponse({ status: HttpStatus.OK, type: PermissionDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.NOT_FOUND)
    public getById(@Query() { realm, permission, view }: GetPermissionByIdQueryDTO): Promise<PermissionDTO> {
        return this.permissionRepository
            .findUniqueOrThrow({ options: { populate: this.populate[view] }, where: { id: permission, realm } })
            .then((data) => super.formatResponse({ DTO: PermissionDTO, data }));
    }

    @Post("list")
    @HttpCode(HttpStatus.OK)
    @RequirePermission(PermissionCode.PERMISSION_READ)
    @ApiOperation({ summary: "Returns a paginated list of permissions" })
    @ApiResponse({ status: HttpStatus.OK, type: PermissionListDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY)
    public getList(
        @Query() { realm, view }: GetPermissionsListQueryDTO,
        @Body() { pagination, filters, sort }: GetPermissionsListBodyDTO,
    ): Promise<PermissionListDTO> {
        return this.permissionRepository
            .findMany({ options: { populate: this.populate[view] }, pagination, filters, realm, sort })
            .then((data) => super.formatResponse({ DTO: PermissionListDTO, pagination, data }));
    }

    @Post("list/lookup")
    @HttpCode(HttpStatus.OK)
    @RequirePermission(PermissionCode.PERMISSION_READ)
    @ApiOperation({ summary: "Returns a lookup list of permissions" })
    @ApiResponse({ status: HttpStatus.OK, type: PermissionLookupListDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY)
    public getLookupList(
        @Query() { realm, term }: GetPermissionsLookupListQueryDTO,
        @Body() { pagination }: GetPermissionsLookupListBodyDTO,
    ): Promise<PermissionLookupListDTO> {
        return this.permissionRepository
            .getLookupList({ pagination, realm, term })
            .then((data) => super.formatResponse({ DTO: PermissionLookupListDTO, pagination, data }));
    }

    @Post("list/effective")
    @HttpCode(HttpStatus.OK)
    @RequirePermission(PermissionCode.PERMISSION_READ)
    @ApiOperation({ summary: "Returns a paginated list of effective permissions for the account" })
    @ApiResponse({ status: HttpStatus.OK, type: PermissionListDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY)
    public getEffectiveList(
        @Query() { account, realm }: GetEffectivePermissionsListQueryDTO,
        @Body() { pagination, filters, sort }: GetEffectivePermissionsListBodyDTO,
    ): Promise<PermissionListDTO> {
        return this.permissionRepository
            .findEffectivePermissions({ where: { account, realm }, pagination, filters, sort })
            .then((data) => super.formatResponse({ DTO: PermissionListDTO, pagination, data }));
    }

    @Post("create")
    @HttpCode(HttpStatus.CREATED)
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
    ): Promise<SuccessMessageDTO> {
        return this.permissionOperation
            .create({ actor, context, input, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data }));
    }

    @Patch("update")
    @HttpCode(HttpStatus.OK)
    @RequirePermission(PermissionCode.PERMISSION_UPDATE)
    @ApiOperation({ summary: "Updates permission metadata" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public updateMetadata(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm, id }: UpdatePermissionQueryDTO,
        @Body() input: UpdatePermissionBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.permissionOperation
            .update({ actor, context, input, realm, id })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Patch("revoke")
    @HttpCode(HttpStatus.OK)
    @RequirePermission(PermissionCode.PERMISSION_REVOKE)
    @ApiOperation({ summary: "Revokes a non-system permission/s" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public revoke(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm }: RevokePermissionQueryDTO,
        @Body() input: RevokePermissionBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.permissionOperation
            .revoke({ actor, context, input, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Patch("restore")
    @HttpCode(HttpStatus.OK)
    @RequirePermission(PermissionCode.PERMISSION_RESTORE)
    @ApiOperation({ summary: "Restores a non-system permission/s" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public restore(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm }: RestorePermissionQueryDTO,
        @Body() input: RestorePermissionBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.permissionOperation
            .restore({ actor, context, input, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Delete("purge")
    @HttpCode(HttpStatus.OK)
    @RequirePermission(PermissionCode.PERMISSION_PURGE)
    @ApiOperation({ summary: "Permanently deletes a revoked non-system permission/s" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public purge(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm }: PurgePermissionQueryDTO,
        @Body() input: PurgePermissionBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.permissionOperation
            .purge({ actor, context, input, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }
}
