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
import { ROLE_REPOSITORY } from "~context/infrastructure/repositories";
import { ROLE_OPERATION } from "~context/application/operations";
import { MonitoringInterceptor } from "~common/interceptors";
import { SuccessMessageDTO } from "~common/dto";
import { PermissionCode } from "~context/enums";

import {
    GetRoleDescendantsListQueryDTO,
    GetRoleDescendantsListBodyDTO,
    GetRoleHierarchyGraphQueryDTO,
    GetDelegableRolesListQueryDTO,
    GetEffectiveRolesListQueryDTO,
    GetDelegableRolesListBodyDTO,
    GetEffectiveRolesListBodyDTO,
    GetRoleAncestorsListQueryDTO,
    GetRoleAncestorsListBodyDTO,
    GetRolesLookupListQueryDTO,
    GetRolesLookupListBodyDTO,
    PurgeRoleSubtreeQueryDTO,
    PurgeRoleSubtreeBodyDTO,
    RoleHierarchyGraphDTO,
    RoleHierarchyListDTO,
    GetRolesListQueryDTO,
    RestoreRoleQueryDTO,
    GetRoleByIdQueryDTO,
    GetRolesListBodyDTO,
    CreateRoleQueryDTO,
    RevokeRoleQueryDTO,
    UpdateRoleQueryDTO,
    RestoreRoleBodyDTO,
    CreateRoleBodyDTO,
    RevokeRoleBodyDTO,
    UpdateRoleBodyDTO,
    PurgeRoleQueryDTO,
    RoleLookupListDTO,
    PurgeRoleBodyDTO,
    RoleListDTO,
    RoleDTO,
} from "../dto/role";

@ApiTags("Role")
@Controller("/role")
@UseInterceptors(MonitoringInterceptor)
export class RoleController {
    private readonly populate = {
        DETAILED: ["realm"] as const,
        COMPACT: [] as const,
    };

    public constructor(
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: Repositories.Role.Contract,
        @Inject(ROLE_OPERATION)
        private readonly roleOperation: Operations.Role.Contract,
    ) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    @FormatResponse(RoleDTO)
    @RequirePermission(PermissionCode.ROLE_READ)
    @ApiOperation({ summary: "Returns a role by identifier" })
    @ApiResponse({ status: HttpStatus.OK, type: RoleDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.NOT_FOUND)
    public getById(@Query() { realm, role, view }: GetRoleByIdQueryDTO): Promise<Repositories.Role.Entity> {
        return this.roleRepository.findUniqueOrThrow({
            options: { populate: this.populate[view] },
            where: { id: role, realm },
        });
    }

    @Post("list")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(RoleListDTO)
    @RequirePermission(PermissionCode.ROLE_READ)
    @ApiOperation({ summary: "Returns a paginated list of roles" })
    @ApiResponse({ status: HttpStatus.OK, type: RoleListDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY)
    public getList(
        @Query() { realm, view }: GetRolesListQueryDTO,
        @Body() { pagination, filters, sort }: GetRolesListBodyDTO,
    ): Promise<[Repositories.Role.Entity[], number]> {
        return this.roleRepository.findMany({
            options: { populate: this.populate[view] },
            pagination,
            filters,
            realm,
            sort,
        });
    }

    @Post("list/lookup")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(RoleLookupListDTO)
    @RequirePermission(PermissionCode.ROLE_READ)
    @ApiOperation({ summary: "Returns a lookup list of roles" })
    @ApiResponse({ status: HttpStatus.OK, type: RoleLookupListDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY)
    public getLookupList(
        @Query() { realm, term }: GetRolesLookupListQueryDTO,
        @Body() { pagination }: GetRolesLookupListBodyDTO,
    ): Promise<[Repositories.Role.Entity[], number]> {
        return this.roleRepository.getLookupList({ pagination, realm, term });
    }

    @Post("list/ancestors")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(RoleHierarchyListDTO)
    @RequirePermission(PermissionCode.ROLE_READ)
    @ApiOperation({ summary: "Returns a paginated list of ancestor roles of the specified role, including itself" })
    @ApiResponse({ status: HttpStatus.OK, type: RoleHierarchyListDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY)
    public getAncestorsList(
        @Query() { descendant, realm, view }: GetRoleAncestorsListQueryDTO,
        @Body() { pagination, filters }: GetRoleAncestorsListBodyDTO,
    ): Promise<[Repositories.Role.DepthEntity[], number]> {
        return this.roleRepository.findAncestors({
            populate: this.populate[view],
            descendant,
            pagination,
            filters,
            realm,
        });
    }

    @HttpCode(HttpStatus.OK)
    @Post("list/descendants")
    @FormatResponse(RoleHierarchyListDTO)
    @RequirePermission(PermissionCode.ROLE_READ)
    @ApiOperation({ summary: "Returns a paginated list of descendant roles of the specified role, including itself" })
    @ApiResponse({ status: HttpStatus.OK, type: RoleHierarchyListDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY)
    public getDescendantsList(
        @Query() { ancestor, realm, view }: GetRoleDescendantsListQueryDTO,
        @Body() { pagination, filters }: GetRoleDescendantsListBodyDTO,
    ): Promise<[Repositories.Role.DepthEntity[], number]> {
        return this.roleRepository.findDescendants({
            populate: this.populate[view],
            ancestor,
            pagination,
            filters,
            realm,
        });
    }

    @Post("list/delegable")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(RoleListDTO)
    @RequirePermission(PermissionCode.ROLE_READ)
    @ApiOperation({ summary: "Returns a paginated list of delegable roles for the specified role/account" })
    @ApiResponse({ status: HttpStatus.OK, type: RoleListDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY)
    public getDelegableList(
        @Query() { realm, type, id }: GetDelegableRolesListQueryDTO,
        @Body() { pagination, filters, sort }: GetDelegableRolesListBodyDTO,
    ): Promise<[Repositories.Role.Entity[], number]> {
        return this.roleRepository.findDelegateableRoles({ where: { realm, type, id }, pagination, filters, sort });
    }

    @Post("list/effective")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(RoleListDTO)
    @RequirePermission(PermissionCode.ROLE_READ)
    @ApiOperation({ summary: "Returns a paginated list of effective roles for the account" })
    @ApiResponse({ status: HttpStatus.OK, type: RoleListDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY)
    public getEffectiveList(
        @Query() { realm, account }: GetEffectiveRolesListQueryDTO,
        @Body() { pagination, filters, sort }: GetEffectiveRolesListBodyDTO,
    ): Promise<[Repositories.Role.Entity[], number]> {
        return this.roleRepository.findEffectiveRoles({ where: { account, realm }, pagination, filters, sort });
    }

    @Get("hierarchy-graph")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(RoleHierarchyGraphDTO)
    @RequirePermission(PermissionCode.ROLE_READ)
    @ApiOperation({ summary: "Returns the role hierarchy graph (nodes and edges)" })
    @ApiResponse({ status: HttpStatus.OK, type: RoleHierarchyGraphDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY)
    public getHierarchyGraph(@Query() { realm }: GetRoleHierarchyGraphQueryDTO): Promise<Repositories.Role.Graph.Data> {
        return this.roleRepository.getHierarchyGraph({ realm });
    }

    @Post("create")
    @HttpCode(HttpStatus.CREATED)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PermissionCode.ROLE_CREATE)
    @ApiOperation({ summary: "Creates a new role" })
    @ApiResponse({ status: HttpStatus.CREATED, type: SuccessMessageDTO })
    @EndpointExceptions(
        HttpStatus.INTERNAL_SERVER_ERROR,
        HttpStatus.UNPROCESSABLE_ENTITY,
        HttpStatus.BAD_REQUEST,
        HttpStatus.CONFLICT,
    )
    public create(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm }: CreateRoleQueryDTO,
        @Body() input: CreateRoleBodyDTO,
    ): Promise<MessageResult> {
        return this.roleOperation.create({ actor, context, input, realm });
    }

    @Patch("update")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PermissionCode.ROLE_UPDATE)
    @ApiOperation({ summary: "Updates role metadata" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public updateMetadata(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm, id }: UpdateRoleQueryDTO,
        @Body() input: UpdateRoleBodyDTO,
    ): Promise<MessageResult> {
        return this.roleOperation.update({ actor, context, input, realm, id });
    }

    @Patch("revoke")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PermissionCode.ROLE_REVOKE)
    @ApiOperation({ summary: "Revokes a non-system role" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public revoke(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm }: RevokeRoleQueryDTO,
        @Body() input: RevokeRoleBodyDTO,
    ): Promise<MessageResult> {
        return this.roleOperation.revoke({ actor, context, input, realm });
    }

    @Patch("restore")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PermissionCode.ROLE_RESTORE)
    @ApiOperation({ summary: "Restores a non-system role" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public restore(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm }: RestoreRoleQueryDTO,
        @Body() input: RestoreRoleBodyDTO,
    ): Promise<MessageResult> {
        return this.roleOperation.restore({ actor, context, input, realm });
    }

    @Delete("purge")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PermissionCode.ROLE_PURGE)
    @ApiOperation({ summary: "Permanently deletes a revoked non-system role" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public purge(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm, id }: PurgeRoleQueryDTO,
        @Body() input: PurgeRoleBodyDTO,
    ): Promise<MessageResult> {
        return this.roleOperation.purge({ actor, context, input, realm, id });
    }

    @HttpCode(HttpStatus.OK)
    @Delete("purge-subtree")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PermissionCode.ROLE_PURGE_SUBTREE)
    @ApiOperation({ summary: "Permanently deletes a role and its entire subtree" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public purgeSubtree(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm, id }: PurgeRoleSubtreeQueryDTO,
        @Body() input: PurgeRoleSubtreeBodyDTO,
    ): Promise<MessageResult> {
        return this.roleOperation.purgeSubtree({ actor, context, input, realm, id });
    }
}
