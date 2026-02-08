import { Body, Controller, HttpStatus, Post, HttpCode, Get, Query } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { I18nService } from "nestjs-i18n";

import { PermissionOverrideRepository } from "~context/infrastructure";
import { ErrorResponseBodyDTO } from "~common/dto";
import { BaseController } from "~common/abstract";

import {
    GetPermissionOverridesListQueryDTO,
    GetPermissionOverridesListBodyDTO,
    GetPermissionOverrideByIdQueryDTO,
    PermissionOverrideListDTO,
    PermissionOverrideDTO,
} from "../dto/permission-override";

@ApiTags("PermissionOverride")
@Controller("/permission-override")
export class PermissionOverrideController extends BaseController {
    private readonly populate = {
        DETAILED: ["permission", "realm"] as const,
        COMPACT: [] as const,
    };

    public constructor(
        private readonly permissionOverrideRepository: PermissionOverrideRepository,
        i18nService: I18nService,
    ) {
        super(i18nService);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a permission-override by identifier" })
    @ApiQuery({ type: GetPermissionOverrideByIdQueryDTO, required: true })
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
    @ApiBody({ type: GetPermissionOverridesListBodyDTO, required: true })
    @ApiQuery({ type: GetPermissionOverridesListQueryDTO, required: true })
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
}
