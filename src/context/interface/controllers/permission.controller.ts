import { Body, Controller, HttpStatus, Post, HttpCode, Get, Query } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { I18nService } from "nestjs-i18n";

import { PermissionRepository } from "~context/infrastructure";
import { ErrorResponseBodyDTO } from "~common/dto";
import { BaseController } from "~common/abstract";

import {
    GetEffectivePermissionsListQueryDTO,
    GetEffectivePermissionsListBodyDTO,
    PermissionLookupPaginatedListDTO,
    GetPermissionsLookupListQueryDTO,
    GetPermissionsLookupListBodyDTO,
    GetPermissionsListQueryDTO,
    PermissionPaginatedListDTO,
    GetPermissionByIdQueryDTO,
    GetPermissionsListBodyDTO,
    PermissionDTO,
} from "../dto/permission";

@ApiTags("Permission")
@Controller("/permission")
export class PermissionController extends BaseController {
    public constructor(
        private readonly permissionRepository: PermissionRepository,
        i18nService: I18nService,
    ) {
        super(i18nService);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a permission by identifier" })
    @ApiQuery({ type: GetPermissionByIdQueryDTO, required: true })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: PermissionDTO })
    public getById(@Query() { realm, permission }: GetPermissionByIdQueryDTO): Promise<PermissionDTO> {
        return this.permissionRepository
            .findUniqueOrThrow({ where: { id: permission, realm } })
            .then((data) => super.formatResponse({ DTO: PermissionDTO, data }));
    }

    @Post("list")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a paginated list of permissions" })
    @ApiBody({ type: GetPermissionsListBodyDTO, required: true })
    @ApiQuery({ type: GetPermissionsListQueryDTO, required: true })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: PermissionPaginatedListDTO })
    public getList(
        @Query() { realm }: GetPermissionsListQueryDTO,
        @Body() { pagination, filters, sort }: GetPermissionsListBodyDTO,
    ): Promise<PermissionPaginatedListDTO> {
        return this.permissionRepository
            .findMany({ pagination, filters, realm, sort })
            .then((data) => super.formatResponse({ DTO: PermissionPaginatedListDTO, pagination, data }));
    }

    @Post("list/lookup")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a lookup list of permissions" })
    @ApiBody({ type: GetPermissionsLookupListBodyDTO, required: true })
    @ApiQuery({ type: GetPermissionsLookupListQueryDTO, required: true })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: PermissionLookupPaginatedListDTO })
    public getLookupList(
        @Query() { realm, term }: GetPermissionsLookupListQueryDTO,
        @Body() { pagination }: GetPermissionsLookupListBodyDTO,
    ): Promise<PermissionLookupPaginatedListDTO> {
        return this.permissionRepository
            .getLookupList({ pagination, realm, term })
            .then((data) => super.formatResponse({ DTO: PermissionLookupPaginatedListDTO, pagination, data }));
    }

    @Post("list/effective")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a paginated list of effective permissions for the account" })
    @ApiBody({ type: GetEffectivePermissionsListBodyDTO, required: true })
    @ApiQuery({ type: GetEffectivePermissionsListQueryDTO, required: true })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: PermissionPaginatedListDTO })
    public getEffectiveList(
        @Query() { account, realm }: GetEffectivePermissionsListQueryDTO,
        @Body() { pagination, filters, sort }: GetEffectivePermissionsListBodyDTO,
    ): Promise<PermissionPaginatedListDTO> {
        return this.permissionRepository
            .findEffectivePermissions({ where: { account, realm }, pagination, filters, sort })
            .then((data) => super.formatResponse({ DTO: PermissionPaginatedListDTO, pagination, data }));
    }

    // TODO: Убрать, временная ручка только для тестов
    @Post("has-permission")
    @HttpCode(HttpStatus.OK)
    @ApiBody({ type: GetEffectivePermissionsListBodyDTO, required: true })
    @ApiQuery({ type: GetEffectivePermissionsListQueryDTO, required: true })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: PermissionPaginatedListDTO })
    public accountHasPermission(@Body() { permission, account, realm, roles }: any): Promise<boolean> {
        return this.permissionRepository.accountHasPermission({ permission, account, realm, roles });
    }
}
