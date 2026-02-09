import { Body, Controller, HttpStatus, Post, HttpCode, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { I18nService } from "nestjs-i18n";

import { RoleRepository } from "~context/infrastructure";
import { ErrorResponseBodyDTO } from "~common/dto";
import { BaseController } from "~common/abstract";

import {
    GetRoleHierarchyGraphQueryDTO,
    GetDelegableRolesListQueryDTO,
    GetEffectiveRolesListQueryDTO,
    GetDelegableRolesListBodyDTO,
    GetEffectiveRolesListBodyDTO,
    GetRolesLookupListQueryDTO,
    GetRolesLookupListBodyDTO,
    RoleHierarchyGraphDTO,
    GetRolesListQueryDTO,
    GetRoleByIdQueryDTO,
    GetRolesListBodyDTO,
    RoleLookupListDTO,
    RoleListDTO,
    RoleDTO,
} from "../dto/role";

@ApiTags("Role")
@Controller("/role")
export class RoleController extends BaseController {
    private readonly populate = {
        DETAILED: ["realm"] as const,
        COMPACT: [] as const,
    };

    public constructor(
        private readonly roleRepository: RoleRepository,
        i18nService: I18nService,
    ) {
        super(i18nService);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a role by identifier" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: RoleDTO })
    public getById(@Query() { realm, role, view }: GetRoleByIdQueryDTO): Promise<RoleDTO> {
        return this.roleRepository
            .findUniqueOrThrow({ options: { populate: this.populate[view] }, where: { id: role, realm } })
            .then((data) => super.formatResponse({ DTO: RoleDTO, data }));
    }

    @Post("list")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a paginated list of roles" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: RoleListDTO })
    public getList(
        @Query() { realm, view }: GetRolesListQueryDTO,
        @Body() { pagination, filters, sort }: GetRolesListBodyDTO,
    ): Promise<RoleListDTO> {
        return this.roleRepository
            .findMany({ options: { populate: this.populate[view] }, pagination, filters, realm, sort })
            .then((data) => super.formatResponse({ DTO: RoleListDTO, pagination, data }));
    }

    @Post("list/lookup")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a lookup list of roles" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: RoleLookupListDTO })
    public getLookupList(
        @Query() { realm, term }: GetRolesLookupListQueryDTO,
        @Body() { pagination }: GetRolesLookupListBodyDTO,
    ): Promise<RoleLookupListDTO> {
        return this.roleRepository
            .getLookupList({ pagination, realm, term })
            .then((data) => super.formatResponse({ DTO: RoleLookupListDTO, pagination, data }));
    }

    @Post("list/delegable")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a paginated list of delegable roles for the specified role/account" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: RoleListDTO })
    public getDelegableList(
        @Query() { realm, type, id }: GetDelegableRolesListQueryDTO,
        @Body() { pagination, filters, sort }: GetDelegableRolesListBodyDTO,
    ): Promise<RoleListDTO> {
        return this.roleRepository
            .findDelegateableRoles({ where: { realm, type, id }, pagination, filters, sort })
            .then((data) => super.formatResponse({ DTO: RoleListDTO, pagination, data }));
    }

    @Post("list/effective")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a paginated list of effective roles for the account" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: RoleListDTO })
    public getEffectiveList(
        @Query() { realm, account }: GetEffectiveRolesListQueryDTO,
        @Body() { pagination, filters, sort }: GetEffectiveRolesListBodyDTO,
    ): Promise<RoleListDTO> {
        return this.roleRepository
            .findEffectiveRoles({ where: { account, realm }, pagination, filters, sort })
            .then((data) => super.formatResponse({ DTO: RoleListDTO, pagination, data }));
    }

    @Get("hierarchy-graph")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns the role hierarchy graph (nodes and edges)" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    public getHierarchyGraph(@Query() { realm }: GetRoleHierarchyGraphQueryDTO): Promise<RoleHierarchyGraphDTO> {
        return this.roleRepository
            .getHierarchyGraph({ realm })
            .then((data) => super.formatResponse({ DTO: RoleHierarchyGraphDTO, data }));
    }
}
