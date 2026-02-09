import { Body, Controller, HttpStatus, Post, HttpCode, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { I18nService } from "nestjs-i18n";

import { RoleConflictGroupRepository } from "~context/infrastructure";
import { ErrorResponseBodyDTO } from "~common/dto";
import { BaseController } from "~common/abstract";

import {
    RoleConflictGroupPaginatedListDTO,
    GetRoleConflictGroupsListQueryDTO,
    GetRoleConflictGroupsListBodyDTO,
    GetRoleConflictGroupByIdQueryDTO,
    GetViolationDetailsQueryDTO,
    GetViolationDetailsBodyDTO,
    RoleConflictGroupListDTO,
    RoleConflictGroupDTO,
} from "../dto/role-conflict-group";

@ApiTags("RoleConflictGroup")
@Controller("/role-conflict-group")
export class RoleConflictGroupController extends BaseController {
    private readonly populate = {
        DETAILED: ["realm"] as const,
        COMPACT: [] as const,
    };

    public constructor(
        private readonly roleConflictGroupRepository: RoleConflictGroupRepository,
        i18nService: I18nService,
    ) {
        super(i18nService);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a role-conflict-group by identifier" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: RoleConflictGroupDTO })
    public getById(@Query() { group, realm, view }: GetRoleConflictGroupByIdQueryDTO): Promise<RoleConflictGroupDTO> {
        return this.roleConflictGroupRepository
            .findUniqueOrThrow({ options: { populate: this.populate[view] }, where: { id: group, realm } })
            .then((data) => super.formatResponse({ DTO: RoleConflictGroupDTO, data }));
    }

    @Post("list")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a paginated list of role-conflict-groups" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: RoleConflictGroupPaginatedListDTO })
    public getList(
        @Query() { realm, view }: GetRoleConflictGroupsListQueryDTO,
        @Body() { pagination, filters, sort }: GetRoleConflictGroupsListBodyDTO,
    ): Promise<RoleConflictGroupPaginatedListDTO> {
        return this.roleConflictGroupRepository
            .findMany({ options: { populate: this.populate[view] }, pagination, filters, sort, realm })
            .then((data) => super.formatResponse({ DTO: RoleConflictGroupPaginatedListDTO, pagination, data }));
    }

    @Post("violation-details")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a list of SoD violation-details" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: RoleConflictGroupListDTO })
    public findViolationDetails(
        @Query() { realm }: GetViolationDetailsQueryDTO,
        @Body() { account, roles }: GetViolationDetailsBodyDTO,
    ): Promise<RoleConflictGroupListDTO> {
        return this.roleConflictGroupRepository
            .findViolationDetails({ account, roles, realm })
            .then((data) => super.formatResponse({ DTO: RoleConflictGroupListDTO, data: { data } }));
    }
}
