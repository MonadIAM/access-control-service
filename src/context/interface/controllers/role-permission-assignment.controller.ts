import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
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

import { EndpointExceptions, ExtractActor, ExtractContext, FormatResponse, RequirePermission } from "~common/decorators";
import { ROLE_PERMISSION_ASSIGNMENT_REPOSITORY } from "~context/infrastructure/repositories";
import { ROLE_PERMISSION_ASSIGNMENT_OPERATION } from "~context/application/operations";
import { MonitoringInterceptor } from "~common/interceptors";
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
export class RolePermissionAssignmentController {
    private readonly populate = {
        DETAILED: ["permission", "realm", "role"] as const,
        COMPACT: [] as const,
    };

    public constructor(
        @Inject(ROLE_PERMISSION_ASSIGNMENT_REPOSITORY)
        private readonly rolePermissionAssignmentRepository: Repositories.RolePermissionAssignment.Contract,
        @Inject(ROLE_PERMISSION_ASSIGNMENT_OPERATION)
        private readonly rolePermissionAssignmentOperation: Operations.RolePermissionAssignment.Contract,
    ) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    @FormatResponse(RolePermissionAssignmentDTO)
    @RequirePermission(PermissionCode.ROLE_PERMISSION_ASSIGNMENT_READ)
    @ApiOperation({ summary: "Returns a role-permission assignment by identifier" })
    @ApiResponse({ status: HttpStatus.OK, type: RolePermissionAssignmentDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.NOT_FOUND)
    public getById(
        @Query() { assignment, realm, view }: GetRolePermissionAssignmentByIdQueryDTO,
    ): Promise<Repositories.RolePermissionAssignment.Entity> {
        return this.rolePermissionAssignmentRepository.findUniqueOrThrow({
            options: { populate: this.populate[view] },
            where: { id: assignment, realm },
        });
    }

    @Post("list")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(RolePermissionAssignmentListDTO)
    @RequirePermission(PermissionCode.ROLE_PERMISSION_ASSIGNMENT_READ)
    @ApiOperation({ summary: "Returns a paginated list of role-permission assignments" })
    @ApiResponse({ status: HttpStatus.OK, type: RolePermissionAssignmentListDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY)
    public getList(
        @Query() { realm, view }: GetRolePermissionAssignmentsListQueryDTO,
        @Body() { pagination, filters, sort }: GetRolePermissionAssignmentsListBodyDTO,
    ): Promise<[Repositories.RolePermissionAssignment.Entity[], number]> {
        return this.rolePermissionAssignmentRepository.findMany({
            options: { populate: this.populate[view] },
            pagination,
            filters,
            sort,
            realm,
        });
    }

    @Post("create")
    @HttpCode(HttpStatus.CREATED)
    @FormatResponse(SuccessMessageDTO)
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
    ): Promise<MessageResult> {
        return this.rolePermissionAssignmentOperation.create({ actor, context, input, realm });
    }

    @Patch("revoke")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PermissionCode.ROLE_PERMISSION_ASSIGNMENT_REVOKE)
    @ApiOperation({ summary: "Revokes a non-system role-permission assignment/s" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public revoke(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm }: RevokeRolePermissionAssignmentQueryDTO,
        @Body() input: RevokeRolePermissionAssignmentBodyDTO,
    ): Promise<MessageResult> {
        return this.rolePermissionAssignmentOperation.revoke({ actor, context, input, realm });
    }

    @Patch("restore")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PermissionCode.ROLE_PERMISSION_ASSIGNMENT_RESTORE)
    @ApiOperation({ summary: "Restores a non-system role-permission assignment/s" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public restore(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm }: RestoreRolePermissionAssignmentQueryDTO,
        @Body() input: RestoreRolePermissionAssignmentBodyDTO,
    ): Promise<MessageResult> {
        return this.rolePermissionAssignmentOperation.restore({ actor, context, input, realm });
    }

    @Delete("purge")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PermissionCode.ROLE_PERMISSION_ASSIGNMENT_PURGE)
    @ApiOperation({ summary: "Permanently deletes a revoked non-system role-permission assignment/s" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public purge(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm }: PurgeRolePermissionAssignmentQueryDTO,
        @Body() input: PurgeRolePermissionAssignmentBodyDTO,
    ): Promise<MessageResult> {
        return this.rolePermissionAssignmentOperation.purge({ actor, context, input, realm });
    }
}
