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

import { ROLE_REPOSITORY } from "~context/infrastructure/repositories";
import { ErrorResponseBodyDTO, SuccessMessageDTO } from "~common/dto";
import { MonitoringInterceptor } from "~common/interceptors";
import { ROLE_HANDLER } from "~context/application/handlers";
import { ExtractContext } from "~common/decorators";
import { BaseController } from "~common/abstract";

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
export class RoleController extends BaseController {
    private readonly populate = {
        DETAILED: ["realm"] as const,
        COMPACT: [] as const,
    };

    public constructor(
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: Repositories.Role.Contract,
        @Inject(ROLE_HANDLER)
        private readonly roleHandler: Handlers.Role.Contract,
        i18nService: I18nService,
    ) {
        super(i18nService);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a role by identifier" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: RoleDTO })
    public getById(@Query() { realm, role, view }: GetRoleByIdQueryDTO): Promise<RoleDTO> {
        return this.roleRepository
            .findUniqueOrThrow({ options: { populate: this.populate[view] }, where: { id: role, realm } })
            .then((data) => super.formatResponse({ DTO: RoleDTO, data }));
    }

    @Post("list")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a paginated list of roles" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: RoleListDTO })
    public getList(
        @Query() { realm, view }: GetRolesListQueryDTO,
        @Body() { pagination, filters, sort }: GetRolesListBodyDTO,
    ): Promise<RoleListDTO> {
        return this.roleRepository
            .findMany({ options: { populate: this.populate[view] }, pagination, filters, realm, sort })
            .then((data) => super.formatResponse({ DTO: RoleListDTO, pagination, data }));
    }

    @Post("list/lookup")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a lookup list of roles" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: RoleLookupListDTO })
    public getLookupList(
        @Query() { realm, term }: GetRolesLookupListQueryDTO,
        @Body() { pagination }: GetRolesLookupListBodyDTO,
    ): Promise<RoleLookupListDTO> {
        return this.roleRepository
            .getLookupList({ pagination, realm, term })
            .then((data) => super.formatResponse({ DTO: RoleLookupListDTO, pagination, data }));
    }

    @Post("list/ancestors")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a paginated list of ancestor roles of the specified role, including itself" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: RoleHierarchyListDTO })
    public getAncestorsList(
        @Query() { descendant, view }: GetRoleAncestorsListQueryDTO,
        @Body() { pagination, filters }: GetRoleAncestorsListBodyDTO,
    ): Promise<RoleHierarchyListDTO> {
        return this.roleRepository
            .findAncestors({
                populate: this.populate[view],
                descendant,
                pagination,
                filters,
            })
            .then((data) => super.formatResponse({ DTO: RoleHierarchyListDTO, pagination, data }));
    }

    @HttpCode(HttpStatus.OK)
    @Post("list/descendants")
    @ApiOperation({ summary: "Returns a paginated list of descendant roles of the specified role, including itself" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: RoleHierarchyListDTO })
    public getDescendantsList(
        @Query() { ancestor, view }: GetRoleDescendantsListQueryDTO,
        @Body() { pagination, filters }: GetRoleDescendantsListBodyDTO,
    ): Promise<RoleHierarchyListDTO> {
        return this.roleRepository
            .findDescendants({
                populate: this.populate[view],
                ancestor,
                pagination,
                filters,
            })
            .then((data) => super.formatResponse({ DTO: RoleHierarchyListDTO, pagination, data }));
    }

    @Post("list/delegable")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a paginated list of delegable roles for the specified role/account" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: RoleListDTO })
    public getDelegableList(
        @Query() { realm, type, id }: GetDelegableRolesListQueryDTO,
        @Body() { pagination, filters, sort }: GetDelegableRolesListBodyDTO,
    ): Promise<RoleListDTO> {
        return this.roleRepository
            .findDelegateableRoles({ where: { realm, type, id }, pagination, filters, sort })
            .then((data) => super.formatResponse({ DTO: RoleListDTO, pagination, data }));
    }

    @Post("list/effective")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a paginated list of effective roles for the account" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: RoleListDTO })
    public getEffectiveList(
        @Query() { realm, account }: GetEffectiveRolesListQueryDTO,
        @Body() { pagination, filters, sort }: GetEffectiveRolesListBodyDTO,
    ): Promise<RoleListDTO> {
        return this.roleRepository
            .findEffectiveRoles({ where: { account, realm }, pagination, filters, sort })
            .then((data) => super.formatResponse({ DTO: RoleListDTO, pagination, data }));
    }

    @Get("hierarchy-graph")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns the role hierarchy graph (nodes and edges)" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: RoleHierarchyGraphDTO })
    public getHierarchyGraph(@Query() { realm }: GetRoleHierarchyGraphQueryDTO): Promise<RoleHierarchyGraphDTO> {
        return this.roleRepository
            .getHierarchyGraph({ realm })
            .then((data) => super.formatResponse({ DTO: RoleHierarchyGraphDTO, data }));
    }

    @Post("create")
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: "Creates a new role" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.CREATED, type: SuccessMessageDTO })
    public create(
        @ExtractContext() context: RequestContext,
        @Query() { realm }: CreateRoleQueryDTO,
        @Body() input: CreateRoleBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.roleHandler
            .create({ input, context, realm, actor: "00000000-0000-4000-8000-000000000000" })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Patch("update")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Updates role metadata" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    public updateMetadata(
        @ExtractContext() context: RequestContext,
        @Query() { realm, id }: UpdateRoleQueryDTO,
        @Body() input: UpdateRoleBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.roleHandler
            .update({ input, context, realm, actor: "00000000-0000-4000-8000-000000000000", id })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Patch("revoke")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Revokes a non-system role" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    public revoke(
        @ExtractContext() context: RequestContext,
        @Query() { realm }: RevokeRoleQueryDTO,
        @Body() input: RevokeRoleBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.roleHandler
            .revoke({ input, context, realm, actor: "00000000-0000-4000-8000-000000000000" })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Patch("restore")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Restores a non-system role" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    public restore(
        @ExtractContext() context: RequestContext,
        @Query() { realm }: RestoreRoleQueryDTO,
        @Body() input: RestoreRoleBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.roleHandler
            .restore({ input, context, realm, actor: "00000000-0000-4000-8000-000000000000" })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Delete("purge")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Permanently deletes a revoked non-system role" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    public purge(
        @ExtractContext() context: RequestContext,
        @Query() { realm, id }: PurgeRoleQueryDTO,
        @Body() input: PurgeRoleBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.roleHandler
            .purge({ input, context, realm, actor: "00000000-0000-4000-8000-000000000000", id })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @HttpCode(HttpStatus.OK)
    @Delete("purge-subtree")
    @ApiOperation({ summary: "Permanently deletes a role and its entire subtree" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    public purgeSubtree(
        @ExtractContext() context: RequestContext,
        @Query() { realm, id }: PurgeRoleSubtreeQueryDTO,
        @Body() input: PurgeRoleSubtreeBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.roleHandler
            .purgeSubtree({ input, context, realm, actor: "00000000-0000-4000-8000-000000000000", id })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }
}
