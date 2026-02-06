import { Body, Controller, HttpStatus, Post, Param, HttpCode, Get } from "@nestjs/common";
import { ApiBody, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { I18nService } from "nestjs-i18n";

import { RoleRepository } from "~context/infrastructure";
import { ErrorResponseBodyDTO } from "~common/dto";
import { BaseController } from "~common/abstract";
import { DelegatorType } from "~context/enums";

import {
    GetDelegableListRolesParamDTO,
    GetEffectiveListRolesParamDTO,
    GetDelegableListRolesBodyDTO,
    GetEffectiveListRolesBodyDTO,
    LookupRolePaginatedListDTO,
    GetLookupListRolesParamDTO,
    GetLookupListRolesBodyDTO,
    GetListRolesParamDTO,
    RolePaginatedListDTO,
    GetRoleByIdParamDTO,
    GetListRolesBodyDTO,
    RoleDTO,
} from "../dto";

@ApiTags("Role")
@Controller("/role")
export class RoleController extends BaseController {
    public constructor(
        private readonly roleRepository: RoleRepository,
        i18nService: I18nService,
    ) {
        super(i18nService);
    }

    @Get(":realm/:role")
    @HttpCode(HttpStatus.OK)
    @ApiParam({ name: "role", required: true, type: String, format: "uuid" })
    @ApiParam({ name: "realm", required: true, type: String, format: "uuid" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: RoleDTO })
    public getById(@Param() { realm, role }: GetRoleByIdParamDTO): Promise<RoleDTO> {
        return this.roleRepository
            .findUniqueOrThrow({ where: { id: role, realm } })
            .then((data) => super.formatResponse({ DTO: RoleDTO, data }));
    }

    @Post("list/:realm")
    @HttpCode(HttpStatus.OK)
    @ApiBody({ type: GetListRolesBodyDTO, required: true })
    @ApiParam({ name: "realm", required: true, type: String, format: "uuid" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: RolePaginatedListDTO })
    public getList(
        @Param() { realm }: GetListRolesParamDTO,
        @Body() { pagination, filters, sort }: GetListRolesBodyDTO,
    ): Promise<RolePaginatedListDTO> {
        return this.roleRepository
            .findMany({ pagination, filters, realm, sort })
            .then((data) => super.formatResponse({ DTO: RolePaginatedListDTO, pagination, data }));
    }

    @HttpCode(HttpStatus.OK)
    @Post("list/lookup/:realm")
    @ApiParam({ name: "realm", required: true, type: String, format: "uuid" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: LookupRolePaginatedListDTO })
    public getLookupList(
        @Param() { realm }: GetLookupListRolesParamDTO,
        @Body() { pagination, term }: GetLookupListRolesBodyDTO,
    ): Promise<LookupRolePaginatedListDTO> {
        return this.roleRepository
            .lookupList({ pagination, realm, term })
            .then((data) => super.formatResponse({ DTO: LookupRolePaginatedListDTO, pagination, data }));
    }

    @HttpCode(HttpStatus.OK)
    @Post("list/delegable/:realm/:type/:id")
    @ApiBody({ type: GetListRolesBodyDTO, required: true })
    @ApiParam({ name: "id", required: true, type: String, format: "uuid" })
    @ApiParam({ name: "realm", required: true, type: String, format: "uuid" })
    @ApiParam({ name: "type", required: true, enum: DelegatorType, enumName: "DelegatorType" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: RolePaginatedListDTO })
    public getDelegateableList(
        @Param() { realm, type, id }: GetDelegableListRolesParamDTO,
        @Body() { pagination, filters, sort }: GetDelegableListRolesBodyDTO,
    ): Promise<RolePaginatedListDTO> {
        return this.roleRepository
            .findDelegateableRoles({ where: { realm, type, id }, pagination, filters, sort })
            .then((data) => super.formatResponse({ DTO: RolePaginatedListDTO, pagination, data }));
    }

    @HttpCode(HttpStatus.OK)
    @Post("list/effective/:realm/:account")
    @ApiBody({ type: GetListRolesBodyDTO, required: true })
    @ApiParam({ name: "realm", required: true, type: String, format: "uuid" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: RolePaginatedListDTO })
    public getEffectiveList(
        @Param() { realm, account }: GetEffectiveListRolesParamDTO,
        @Body() { pagination, filters, sort }: GetEffectiveListRolesBodyDTO,
    ): Promise<RolePaginatedListDTO> {
        return this.roleRepository
            .findEffectiveRoles({ where: { account, realm }, pagination, filters, sort })
            .then((data) => super.formatResponse({ DTO: RolePaginatedListDTO, pagination, data }));
    }

    @HttpCode(HttpStatus.OK)
    @Get("hierarchy-graph/:realm")
    @ApiParam({ name: "realm", required: true, type: String, format: "uuid" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    public getTree(@Param() { realm }: { realm: string }): Promise<unknown> {
        return this.roleRepository.getRoleGraph({ realm });
    }
}
