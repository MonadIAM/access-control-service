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

import { EndpointExceptions, ExtractActor, ExtractContext, RequirePermission } from "~common/decorators";
import { ROLE_PERMISSION_ASSIGNMENT_REPOSITORY } from "~context/infrastructure/repositories";
import { ROLE_PERMISSION_ASSIGNMENT_OPERATION } from "~context/application/operations";
import { MonitoringInterceptor } from "~common/interceptors";
import { BaseController } from "~common/abstract";
import { SuccessMessageDTO } from "~common/dto";
import { PermissionCode } from "~context/enums";

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
        @Inject(ROLE_PERMISSION_ASSIGNMENT_OPERATION)
        private readonly rolePermissionAssignmentOperation: Operations.RolePermissionAssignment.Contract,
        i18nService: I18nService,
    ) {
        super(i18nService);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @RequirePermission(PermissionCode.ROLE_PERMISSION_ASSIGNMENT_READ)
    @ApiOperation({ summary: "Returns a role-permission assignment by identifier" })
    @ApiResponse({ status: HttpStatus.OK, type: RolePermissionAssignmentDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.NOT_FOUND)
    public getById(
        @Query() { assignment, realm, view }: GetRolePermissionAssignmentByIdQueryDTO,
    ): Promise<RolePermissionAssignmentDTO> {
        return this.rolePermissionAssignmentRepository
            .findUniqueOrThrow({ options: { populate: this.populate[view] }, where: { id: assignment, realm } })
            .then((data) => super.formatResponse({ DTO: RolePermissionAssignmentDTO, data }));
    }

    @Post("list")
    @HttpCode(HttpStatus.OK)
    @RequirePermission(PermissionCode.ROLE_PERMISSION_ASSIGNMENT_READ)
    @ApiOperation({ summary: "Returns a paginated list of role-permission assignments" })
    @ApiResponse({ status: HttpStatus.OK, type: RolePermissionAssignmentListDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY)
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
    @RequirePermission(PermissionCode.ROLE_PERMISSION_ASSIGNMENT_CREATE)
    @ApiOperation({ summary: "Creates a new role-permission assignment" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(
        HttpStatus.INTERNAL_SERVER_ERROR,
        HttpStatus.UNPROCESSABLE_ENTITY,
        HttpStatus.BAD_REQUEST,
        HttpStatus.CONFLICT,
    )
    public create(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm }: CreateRolePermissionAssignmentQueryDTO,
        @Body() input: CreateRolePermissionAssignmentBodyDTO,
    ): Promise<SuccessMessageDTO> {
        return this.rolePermissionAssignmentOperation
            .create({ actor, context, input, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data }));
    }

    @Patch("revoke")
    @HttpCode(HttpStatus.OK)
    @RequirePermission(PermissionCode.ROLE_PERMISSION_ASSIGNMENT_REVOKE)
    @ApiOperation({ summary: "Revokes a non-system role-permission assignment/s" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public revoke(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm }: RevokeRolePermissionAssignmentQueryDTO,
        @Body() input: RevokeRolePermissionAssignmentBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.rolePermissionAssignmentOperation
            .revoke({ actor, context, input, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Patch("restore")
    @HttpCode(HttpStatus.OK)
    @RequirePermission(PermissionCode.ROLE_PERMISSION_ASSIGNMENT_RESTORE)
    @ApiOperation({ summary: "Restores a non-system role-permission assignment/s" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public restore(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm }: RestoreRolePermissionAssignmentQueryDTO,
        @Body() input: RestoreRolePermissionAssignmentBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.rolePermissionAssignmentOperation
            .restore({ actor, context, input, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Delete("purge")
    @HttpCode(HttpStatus.OK)
    @RequirePermission(PermissionCode.ROLE_PERMISSION_ASSIGNMENT_PURGE)
    @ApiOperation({ summary: "Permanently deletes a revoked non-system role-permission assignment/s" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public purge(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm }: PurgeRolePermissionAssignmentQueryDTO,
        @Body() input: PurgeRolePermissionAssignmentBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.rolePermissionAssignmentOperation
            .purge({ actor, context, input, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }
}
