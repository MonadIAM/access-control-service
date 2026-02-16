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

import { ROLE_PERMISSION_ASSIGNMENT_REPOSITORY } from "~context/infrastructure/repositories";
import { ROLE_PERMISSION_ASSIGNMENT_HANDLER } from "~context/application/handlers";
import { ErrorResponseBodyDTO, SuccessMessageDTO } from "~common/dto";
import { MonitoringInterceptor } from "~common/interceptors";
import { ExtractContext } from "~common/decorators";
import { BaseController } from "~common/abstract";

import {
    GetRolePermissionAssignmentsListQueryDTO,
    GetRolePermissionAssignmentsListBodyDTO,
    GetRolePermissionAssignmentByIdQueryDTO,
    RestoreRolePermissionAssignmentQueryDTO,
    RestoreRolePermissionAssignmentBodyDTO,
    RevokeRolePermissionAssignmentQueryDTO,
    CreateRolePermissionAssignmentQueryDTO,
    PurgeRolePermissionAssignmentQueryDTO,
    RevokeRolePermissionAssignmentBodyDTO,
    CreateRolePermissionAssignmentBodyDTO,
    PurgeRolePermissionAssignmentBodyDTO,
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
        @Inject(ROLE_PERMISSION_ASSIGNMENT_HANDLER)
        private readonly rolePermissionAssignmentHandler: Handlers.RolePermissionAssignment.Contract,
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

    @Post("create")
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: "Creates a new role-permission assignment" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    public create(
        @ExtractContext() context: RequestContext,
        @Query() { realm }: CreateRolePermissionAssignmentQueryDTO,
        @Body() input: CreateRolePermissionAssignmentBodyDTO,
    ): Promise<SuccessMessageDTO> {
        return this.rolePermissionAssignmentHandler
            .create({ actor: "00000000-0000-4000-8000-000000000000", input, context, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data }));
    }

    @Patch("revoke")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Revokes a non-system role-permission assignment/s" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    public revoke(
        @ExtractContext() context: RequestContext,
        @Query() { realm }: RevokeRolePermissionAssignmentQueryDTO,
        @Body() input: RevokeRolePermissionAssignmentBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.rolePermissionAssignmentHandler
            .revoke({ actor: "00000000-0000-4000-8000-000000000000", input, context, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Patch("restore")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Restores a non-system role-permission assignment/s" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    public restore(
        @ExtractContext() context: RequestContext,
        @Query() { realm }: RestoreRolePermissionAssignmentQueryDTO,
        @Body() input: RestoreRolePermissionAssignmentBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.rolePermissionAssignmentHandler
            .restore({ actor: "00000000-0000-4000-8000-000000000000", input, context, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Delete("purge")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Permanently deletes a revoked non-system role-permission assignment/s" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    public purge(
        @ExtractContext() context: RequestContext,
        @Query() { realm }: PurgeRolePermissionAssignmentQueryDTO,
        @Body() input: PurgeRolePermissionAssignmentBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.rolePermissionAssignmentHandler
            .purge({ actor: "00000000-0000-4000-8000-000000000000", input, context, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }
}
