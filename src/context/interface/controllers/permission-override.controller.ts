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
import { PERMISSION_OVERRIDE_REPOSITORY } from "~context/infrastructure/repositories";
import { PERMISSION_OVERRIDE_OPERATION } from "~context/application/operations";
import { MonitoringInterceptor } from "~common/interceptors";
import { BaseController } from "~common/abstract";
import { SuccessMessageDTO } from "~common/dto";
import { PermissionCode } from "~context/enums";

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

@ApiTags("PermissionOverride")
@Controller("/permission-override")
@UseInterceptors(MonitoringInterceptor)
export class PermissionOverrideController extends BaseController {
    private readonly populate = {
        DETAILED: ["permission", "realm"] as const,
        COMPACT: [] as const,
    };

    public constructor(
        @Inject(PERMISSION_OVERRIDE_REPOSITORY)
        private readonly permissionOverrideRepository: Repositories.PermissionOverride.Contract,
        @Inject(PERMISSION_OVERRIDE_OPERATION)
        private readonly permissionOverrideOperation: Operations.PermissionOverride.Contract,
        i18nService: I18nService,
    ) {
        super(i18nService);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @RequirePermission(PermissionCode.PERMISSION_OVERRIDE_READ)
    @ApiOperation({ summary: "Returns a permission override by identifier" })
    @ApiResponse({ status: HttpStatus.OK, type: PermissionOverrideDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.NOT_FOUND)
    public getById(@Query() { override, realm, view }: GetPermissionOverrideByIdQueryDTO): Promise<PermissionOverrideDTO> {
        return this.permissionOverrideRepository
            .findUniqueOrThrow({ options: { populate: this.populate[view] }, where: { id: override, realm } })
            .then((data) => super.formatResponse({ DTO: PermissionOverrideDTO, data }));
    }

    @Post("list")
    @HttpCode(HttpStatus.OK)
    @RequirePermission(PermissionCode.PERMISSION_OVERRIDE_READ)
    @ApiOperation({ summary: "Returns a paginated list of permission overrides" })
    @ApiResponse({ status: HttpStatus.OK, type: PermissionOverrideListDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY)
    public getList(
        @Query() { realm, view }: GetPermissionOverridesListQueryDTO,
        @Body() { pagination, filters, sort }: GetPermissionOverridesListBodyDTO,
    ): Promise<PermissionOverrideListDTO> {
        return this.permissionOverrideRepository
            .findMany({ options: { populate: this.populate[view] }, pagination, filters, sort, realm })
            .then((data) => super.formatResponse({ DTO: PermissionOverrideListDTO, pagination, data }));
    }

    @Post("create")
    @HttpCode(HttpStatus.CREATED)
    @RequirePermission(PermissionCode.PERMISSION_OVERRIDE_CREATE)
    @ApiOperation({ summary: "Creates a new permission override" })
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
        @Query() { realm }: CreatePermissionOverrideQueryDTO,
        @Body() input: CreatePermissionOverrideBodyDTO,
    ): Promise<SuccessMessageDTO> {
        return this.permissionOverrideOperation
            .create({ actor, context, input, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data }));
    }

    @Patch("revoke")
    @HttpCode(HttpStatus.OK)
    @RequirePermission(PermissionCode.PERMISSION_OVERRIDE_REVOKE)
    @ApiOperation({ summary: "Revokes a non-system permission override/s" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public revoke(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm }: RevokePermissionOverrideQueryDTO,
        @Body() input: RevokePermissionOverrideBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.permissionOverrideOperation
            .revoke({ actor, context, input, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Patch("restore")
    @HttpCode(HttpStatus.OK)
    @RequirePermission(PermissionCode.PERMISSION_OVERRIDE_RESTORE)
    @ApiOperation({ summary: "Restores a non-system permission override/s" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public restore(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm }: RestorePermissionOverrideQueryDTO,
        @Body() input: RestorePermissionOverrideBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.permissionOverrideOperation
            .restore({ actor, context, input, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Delete("purge")
    @HttpCode(HttpStatus.OK)
    @RequirePermission(PermissionCode.PERMISSION_OVERRIDE_PURGE)
    @ApiOperation({ summary: "Permanently deletes a revoked non-system permission override/s" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public purge(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm }: PurgePermissionOverrideQueryDTO,
        @Body() input: PurgePermissionOverrideBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.permissionOverrideOperation
            .purge({ actor, context, input, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }
}
