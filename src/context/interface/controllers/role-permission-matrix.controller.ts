import { Body, Controller, HttpStatus, Post, HttpCode, Get, Query } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { I18nService } from "nestjs-i18n";

import { RolePermissionMatrixRepository } from "~context/infrastructure";
import { ErrorResponseBodyDTO } from "~common/dto";
import { BaseController } from "~common/abstract";

import {
    GetRolePermissionMatricesListQueryDTO,
    GetRolePermissionMatricesListBodyDTO,
    GetRolePermissionMatrixByIdQueryDTO,
    RolePermissionMatrixListDTO,
    RolePermissionMatrixDTO,
} from "../dto/role-permission-matrix";

@ApiTags("RolePermissionMatrix")
@Controller("/role-permission-matrix")
export class RolePermissionMatrixController extends BaseController {
    public constructor(
        private readonly rolePermissionMatrixRepository: RolePermissionMatrixRepository,
        i18nService: I18nService,
    ) {
        super(i18nService);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a role-permission-matrix by identifier" })
    @ApiQuery({ type: GetRolePermissionMatrixByIdQueryDTO, required: true })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: RolePermissionMatrixDTO })
    public getById(@Query() { matrix, realm }: GetRolePermissionMatrixByIdQueryDTO): Promise<RolePermissionMatrixDTO> {
        return this.rolePermissionMatrixRepository
            .findUniqueOrThrow({ where: { id: matrix, realm } })
            .then((data) => super.formatResponse({ DTO: RolePermissionMatrixDTO, data }));
    }

    @Post("list")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a paginated list of role-permission-matrices" })
    @ApiBody({ type: GetRolePermissionMatricesListBodyDTO, required: true })
    @ApiQuery({ type: GetRolePermissionMatricesListQueryDTO, required: true })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: RolePermissionMatrixListDTO })
    public getList(
        @Query() { realm }: GetRolePermissionMatricesListQueryDTO,
        @Body() { pagination, filters, sort }: GetRolePermissionMatricesListBodyDTO,
    ): Promise<RolePermissionMatrixListDTO> {
        return this.rolePermissionMatrixRepository
            .findMany({ pagination, filters, sort, realm })
            .then((data) => super.formatResponse({ DTO: RolePermissionMatrixListDTO, pagination, data }));
    }
}
