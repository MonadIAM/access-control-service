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

import { PERMISSION_OVERRIDE_REPOSITORY } from "~context/infrastructure/repositories";
import { PERMISSION_OVERRIDE_HANDLER } from "~context/application/handlers";
import { ErrorResponseBodyDTO, SuccessMessageDTO } from "~common/dto";
import { MonitoringInterceptor } from "~common/interceptors";
import { ExtractContext } from "~common/decorators";
import { BaseController } from "~common/abstract";

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
        @Inject(PERMISSION_OVERRIDE_HANDLER)
        private readonly permissionOverrideHandler: Handlers.PermissionOverride.Contract,
        i18nService: I18nService,
    ) {
        super(i18nService);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a permission-override by identifier" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: PermissionOverrideDTO })
    public getById(@Query() { override, realm, view }: GetPermissionOverrideByIdQueryDTO): Promise<PermissionOverrideDTO> {
        return this.permissionOverrideRepository
            .findUniqueOrThrow({ options: { populate: this.populate[view] }, where: { id: override, realm } })
            .then((data) => super.formatResponse({ DTO: PermissionOverrideDTO, data }));
    }

    @Post("list")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a paginated list of permission-overrides" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: PermissionOverrideListDTO })
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
    @ApiOperation({ summary: "Creates a new permission" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    public create(
        @ExtractContext() context: RequestContext,
        @Query() { realm }: CreatePermissionOverrideQueryDTO,
        @Body() input: CreatePermissionOverrideBodyDTO,
    ): Promise<SuccessMessageDTO> {
        return this.permissionOverrideHandler
            .create({ actor: "00000000-0000-4000-8000-000000000000", input, context, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data }));
    }

    @Patch("revoke")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Revokes a non-system permission-override/s" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    public revoke(
        @ExtractContext() context: RequestContext,
        @Query() { realm }: RevokePermissionOverrideQueryDTO,
        @Body() input: RevokePermissionOverrideBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.permissionOverrideHandler
            .revoke({ actor: "00000000-0000-4000-8000-000000000000", input, context, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Patch("restore")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Restores a non-system permission-override/s" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    public restore(
        @ExtractContext() context: RequestContext,
        @Query() { realm }: RestorePermissionOverrideQueryDTO,
        @Body() input: RestorePermissionOverrideBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.permissionOverrideHandler
            .restore({ actor: "00000000-0000-4000-8000-000000000000", input, context, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Delete("purge")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Permanently deletes a revoked non-system permission-override/s" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    public purge(
        @ExtractContext() context: RequestContext,
        @Query() { realm }: PurgePermissionOverrideQueryDTO,
        @Body() input: PurgePermissionOverrideBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.permissionOverrideHandler
            .purge({ actor: "00000000-0000-4000-8000-000000000000", input, context, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }
}
