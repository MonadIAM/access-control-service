import { Body, Controller, HttpStatus, Post, HttpCode, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { I18nService } from "nestjs-i18n";

import { PermissionRepository } from "~context/infrastructure";
import { ErrorResponseBodyDTO } from "~common/dto";
import { BaseController } from "~common/abstract";

import {
    GetEffectivePermissionsListQueryDTO,
    GetEffectivePermissionsListBodyDTO,
    GetPermissionsLookupListQueryDTO,
    GetPermissionsLookupListBodyDTO,
    GetPermissionsListQueryDTO,
    GetPermissionByIdQueryDTO,
    GetPermissionsListBodyDTO,
    PermissionLookupListDTO,
    PermissionListDTO,
    PermissionDTO,
} from "../dto/permission";

@ApiTags("Permission")
@Controller("/permission")
export class PermissionController extends BaseController {
    private readonly populate = {
        DETAILED: ["realm"] as const,
        COMPACT: [] as const,
    };

    public constructor(
        private readonly permissionRepository: PermissionRepository,
        i18nService: I18nService,
    ) {
        super(i18nService);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a permission by identifier" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: PermissionDTO })
    public getById(@Query() { realm, permission, view }: GetPermissionByIdQueryDTO): Promise<PermissionDTO> {
        return this.permissionRepository
            .findUniqueOrThrow({ options: { populate: this.populate[view] }, where: { id: permission, realm } })
            .then((data) => super.formatResponse({ DTO: PermissionDTO, data }));
    }

    @Post("list")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a paginated list of permissions" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: PermissionListDTO })
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
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: PermissionLookupListDTO })
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
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: PermissionListDTO })
    public getEffectiveList(
        @Query() { account, realm }: GetEffectivePermissionsListQueryDTO,
        @Body() { pagination, filters, sort }: GetEffectivePermissionsListBodyDTO,
    ): Promise<PermissionListDTO> {
        return this.permissionRepository
            .findEffectivePermissions({ where: { account, realm }, pagination, filters, sort })
            .then((data) => super.formatResponse({ DTO: PermissionListDTO, pagination, data }));
    }
}
