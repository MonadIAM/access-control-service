import { Body, Controller, HttpStatus, Post, HttpCode, Get, Query, UseInterceptors, Inject } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { I18nService } from "nestjs-i18n";

import { ROLE_PERMISSION_ASSIGNMENT_REPOSITORY } from "~context/infrastructure/repositories";
import { MonitoringInterceptor } from "~common/interceptors";
import { ErrorResponseBodyDTO } from "~common/dto";
import { BaseController } from "~common/abstract";

import {
    GetRolePermissionAssignmentsListQueryDTO,
    GetRolePermissionAssignmentsListBodyDTO,
    GetRolePermissionAssignmentByIdQueryDTO,
    RolePermissionAssignmentListDTO,
    RolePermissionAssignmentDTO,
} from "../dto/role-permission-assignment";

@ApiTags("RolePermissionAssignment")
@Controller("/role-permission-assignment")
@UseInterceptors(MonitoringInterceptor)
export class RolePermissionAssignmentController extends BaseController {
    private readonly populate = {
        DETAILED: ["permission", "realm", "role"] as const,
        COMPACT: [] as const,
    };

    public constructor(
        @Inject(ROLE_PERMISSION_ASSIGNMENT_REPOSITORY)
        private readonly rolePermissionAssignmentRepository: Repositories.RolePermissionAssignment.Contract,
        i18nService: I18nService,
    ) {
        super(i18nService);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a role-permission-assignment by identifier" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: RolePermissionAssignmentDTO })
    public getById(
        @Query() { assignment, realm, view }: GetRolePermissionAssignmentByIdQueryDTO,
    ): Promise<RolePermissionAssignmentDTO> {
        return this.rolePermissionAssignmentRepository
            .findUniqueOrThrow({ options: { populate: this.populate[view] }, where: { id: assignment, realm } })
            .then((data) => super.formatResponse({ DTO: RolePermissionAssignmentDTO, data }));
    }

    @Post("list")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a paginated list of role-permission-assignments" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: RolePermissionAssignmentListDTO })
    public getList(
        @Query() { realm, view }: GetRolePermissionAssignmentsListQueryDTO,
        @Body() { pagination, filters, sort }: GetRolePermissionAssignmentsListBodyDTO,
    ): Promise<RolePermissionAssignmentListDTO> {
        return this.rolePermissionAssignmentRepository
            .findMany({ options: { populate: this.populate[view] }, pagination, filters, sort, realm })
            .then((data) => super.formatResponse({ DTO: RolePermissionAssignmentListDTO, pagination, data }));
    }
}
