import { Body, Controller, HttpStatus, Post, HttpCode, Get, Query, UseInterceptors, Inject } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { I18nService } from "nestjs-i18n";

import { ROLE_PERMISSION_MATRIX_REPOSITORY } from "~context/infrastructure/repositories";
import { MonitoringInterceptor } from "~common/interceptors";
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
@UseInterceptors(MonitoringInterceptor)
export class RolePermissionMatrixController extends BaseController {
    private readonly populate = {
        DETAILED: ["permission", "realm", "role"] as const,
        COMPACT: [] as const,
    };

    public constructor(
        @Inject(ROLE_PERMISSION_MATRIX_REPOSITORY)
        private readonly rolePermissionMatrixRepository: Repositories.RolePermissionMatrix.Contract,
        i18nService: I18nService,
    ) {
        super(i18nService);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a role-permission-matrix by identifier" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: RolePermissionMatrixDTO })
    public getById(
        @Query() { matrix, realm, view }: GetRolePermissionMatrixByIdQueryDTO,
    ): Promise<RolePermissionMatrixDTO> {
        return this.rolePermissionMatrixRepository
            .findUniqueOrThrow({ options: { populate: this.populate[view] }, where: { id: matrix, realm } })
            .then((data) => super.formatResponse({ DTO: RolePermissionMatrixDTO, data }));
    }

    @Post("list")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a paginated list of role-permission-matrices" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: RolePermissionMatrixListDTO })
    public getList(
        @Query() { realm, view }: GetRolePermissionMatricesListQueryDTO,
        @Body() { pagination, filters, sort }: GetRolePermissionMatricesListBodyDTO,
    ): Promise<RolePermissionMatrixListDTO> {
        return this.rolePermissionMatrixRepository
            .findMany({ options: { populate: this.populate[view] }, pagination, filters, sort, realm })
            .then((data) => super.formatResponse({ DTO: RolePermissionMatrixListDTO, pagination, data }));
    }
}
