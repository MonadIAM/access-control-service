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

import { PERMISSION_REPOSITORY } from "~context/infrastructure/repositories";
import { EndpointExceptions, ExtractContext } from "~common/decorators";
import { PERMISSION_HANDLER } from "~context/application/handlers";
import { MonitoringInterceptor } from "~common/interceptors";
import { BaseController } from "~common/abstract";
import { SuccessMessageDTO } from "~common/dto";

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
        @Inject(PERMISSION_HANDLER)
        private readonly permissionHandler: Handlers.Permission.Contract,
        i18nService: I18nService,
    ) {
        super(i18nService);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
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
    @ApiOperation({ summary: "Creates a new permission" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(
        HttpStatus.INTERNAL_SERVER_ERROR,
        HttpStatus.UNPROCESSABLE_ENTITY,
        HttpStatus.BAD_REQUEST,
        HttpStatus.CONFLICT,
    )
    public create(
        @ExtractContext() context: RequestContext,
        @Query() { realm }: CreatePermissionQueryDTO,
        @Body() input: CreatePermissionBodyDTO,
    ): Promise<SuccessMessageDTO> {
        return this.permissionHandler
            .create({ actor: "00000000-0000-4000-8000-000000000000", input, context, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data }));
    }

    @Patch("update")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Updates permission metadata" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public updateMetadata(
        @ExtractContext() context: RequestContext,
        @Query() { realm, id }: UpdatePermissionQueryDTO,
        @Body() input: UpdatePermissionBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.permissionHandler
            .update({ id, actor: "00000000-0000-4000-8000-000000000000", input, context, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Patch("revoke")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Revokes a non-system permission/s" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public revoke(
        @ExtractContext() context: RequestContext,
        @Query() { realm }: RevokePermissionQueryDTO,
        @Body() input: RevokePermissionBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.permissionHandler
            .revoke({ actor: "00000000-0000-4000-8000-000000000000", input, context, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Patch("restore")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Restores a non-system permission/s" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public restore(
        @ExtractContext() context: RequestContext,
        @Query() { realm }: RestorePermissionQueryDTO,
        @Body() input: RestorePermissionBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.permissionHandler
            .restore({ actor: "00000000-0000-4000-8000-000000000000", input, context, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Delete("purge")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Permanently deletes a revoked non-system permission/s" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public purge(
        @ExtractContext() context: RequestContext,
        @Query() { realm }: PurgePermissionQueryDTO,
        @Body() input: PurgePermissionBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.permissionHandler
            .purge({ actor: "00000000-0000-4000-8000-000000000000", input, context, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }
}
