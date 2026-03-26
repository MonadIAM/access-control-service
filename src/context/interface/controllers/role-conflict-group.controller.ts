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
import { ROLE_CONFLICT_GROUP_REPOSITORY } from "~context/infrastructure/repositories";
import { ROLE_CONFLICT_GROUP_OPERATION } from "~context/application/operations";
import { MonitoringInterceptor } from "~common/interceptors";
import { SuccessMessageDTO } from "~common/dto";
import { PermissionCode } from "~context/enums";

import {
    RoleConflictGroupPaginatedListDTO,
    GetRoleConflictGroupsListQueryDTO,
    GetRoleConflictGroupsListBodyDTO,
    GetRoleConflictGroupByIdQueryDTO,
    RestoreRoleConflictGroupQueryDTO,
    RestoreRoleConflictGroupBodyDTO,
    RevokeRoleConflictGroupQueryDTO,
    CreateRoleConflictGroupQueryDTO,
    UpdateRoleConflictGroupQueryDTO,
    UpdateRoleConflictGroupBodyDTO,
    RevokeRoleConflictGroupBodyDTO,
    CreateRoleConflictGroupBodyDTO,
    PurgeRoleConflictGroupQueryDTO,
    PurgeRoleConflictGroupBodyDTO,
    GetViolationDetailsQueryDTO,
    GetViolationDetailsBodyDTO,
    RoleConflictGroupListDTO,
    RoleConflictGroupDTO,
} from "../dto/role-conflict-group";

@ApiTags("RoleConflictGroup")
@Controller("/role-conflict-group")
@UseInterceptors(MonitoringInterceptor)
export class RoleConflictGroupController {
    private readonly populate = {
        DETAILED: ["realm"] as const,
        COMPACT: [] as const,
    };

    public constructor(
        @Inject(ROLE_CONFLICT_GROUP_REPOSITORY)
        private readonly roleConflictGroupRepository: Repositories.RoleConflictGroup.Contract,
        @Inject(ROLE_CONFLICT_GROUP_OPERATION)
        private readonly roleConflictGroupOperation: Operations.RoleConflictGroup.Contract,
    ) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    @FormatResponse(RoleConflictGroupDTO)
    @RequirePermission(PermissionCode.ROLE_CONFLICT_GROUP_READ_ALL)
    @ApiOperation({ summary: "Returns a role conflict group by identifier" })
    @ApiResponse({ status: HttpStatus.OK, type: RoleConflictGroupDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.NOT_FOUND)
    public getById(
        @Query() { group, realm, view }: GetRoleConflictGroupByIdQueryDTO,
    ): Promise<Repositories.RoleConflictGroup.Entity> {
        return this.roleConflictGroupRepository.findUniqueOrThrow({
            options: { populate: this.populate[view] },
            where: { id: group, realm },
        });
    }

    @Post("list")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(RoleConflictGroupPaginatedListDTO)
    @RequirePermission(PermissionCode.ROLE_CONFLICT_GROUP_READ_ALL)
    @ApiOperation({ summary: "Returns a paginated list of role conflict groups" })
    @ApiResponse({ status: HttpStatus.OK, type: RoleConflictGroupPaginatedListDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY)
    public getList(
        @Query() { realm, view }: GetRoleConflictGroupsListQueryDTO,
        @Body() { pagination, filters, sort }: GetRoleConflictGroupsListBodyDTO,
    ): Promise<[Repositories.RoleConflictGroup.Entity[], number]> {
        return this.roleConflictGroupRepository.findMany({
            options: { populate: this.populate[view] },
            pagination,
            filters,
            realm,
            sort,
        });
    }

    @HttpCode(HttpStatus.OK)
    @Post("violation-details")
    @FormatResponse(RoleConflictGroupListDTO)
    @RequirePermission(PermissionCode.ROLE_CONFLICT_GROUP_CREATE)
    @ApiOperation({ summary: "Returns a list of SoD violation details" })
    @ApiResponse({ status: HttpStatus.OK, type: RoleConflictGroupListDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY)
    public findViolationDetails(
        @Query() { realm }: GetViolationDetailsQueryDTO,
        @Body() { account, roles }: GetViolationDetailsBodyDTO,
    ): Promise<Repositories.RoleConflictGroup.Entity[]> {
        return this.roleConflictGroupRepository.findViolationDetails({ account, roles, realm });
    }

    @Post("create")
    @HttpCode(HttpStatus.CREATED)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PermissionCode.ROLE_CONFLICT_GROUP_CREATE)
    @ApiOperation({ summary: "Creates a new role conflict group" })
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
        @Query() { realm }: CreateRoleConflictGroupQueryDTO,
        @Body() input: CreateRoleConflictGroupBodyDTO,
    ): Promise<MessageResult> {
        return this.roleConflictGroupOperation.create({ actor, context, input, realm });
    }

    @Patch("update")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PermissionCode.ROLE_CONFLICT_GROUP_UPDATE)
    @ApiOperation({ summary: "Updates role conflict group metadata" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public updateMetadata(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm, id }: UpdateRoleConflictGroupQueryDTO,
        @Body() input: UpdateRoleConflictGroupBodyDTO,
    ): Promise<MessageResult> {
        return this.roleConflictGroupOperation.update({ actor, context, input, realm, id });
    }

    @Patch("revoke")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PermissionCode.ROLE_CONFLICT_GROUP_REVOKE)
    @ApiOperation({ summary: "Revokes a non-system role conflict group/s" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public revoke(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm }: RevokeRoleConflictGroupQueryDTO,
        @Body() input: RevokeRoleConflictGroupBodyDTO,
    ): Promise<MessageResult> {
        return this.roleConflictGroupOperation.revoke({ actor, context, input, realm });
    }

    @Patch("restore")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PermissionCode.ROLE_CONFLICT_GROUP_RESTORE)
    @ApiOperation({ summary: "Restores a non-system role conflict group/s" })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    public restore(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm }: RestoreRoleConflictGroupQueryDTO,
        @Body() input: RestoreRoleConflictGroupBodyDTO,
    ): Promise<MessageResult> {
        return this.roleConflictGroupOperation.restore({ actor, context, input, realm });
    }

    @Delete("purge")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PermissionCode.ROLE_CONFLICT_GROUP_PURGE)
    @ApiOperation({ summary: "Permanently deletes a revoked non-system role conflict group/s" })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    public purge(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm }: PurgeRoleConflictGroupQueryDTO,
        @Body() input: PurgeRoleConflictGroupBodyDTO,
    ): Promise<MessageResult> {
        return this.roleConflictGroupOperation.purge({ actor, context, input, realm });
    }
}
