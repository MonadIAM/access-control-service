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

import { ROLE_CONFLICT_GROUP_REPOSITORY } from "~context/infrastructure/repositories";
import { ROLE_CONFLICT_GROUP_HANDLER } from "~context/application/handlers";
import { ErrorResponseBodyDTO, SuccessMessageDTO } from "~common/dto";
import { MonitoringInterceptor } from "~common/interceptors";
import { ExtractContext } from "~common/decorators";
import { BaseController } from "~common/abstract";

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
export class RoleConflictGroupController extends BaseController {
    private readonly populate = {
        DETAILED: ["realm"] as const,
        COMPACT: [] as const,
    };

    public constructor(
        @Inject(ROLE_CONFLICT_GROUP_REPOSITORY)
        private readonly roleConflictGroupRepository: Repositories.RoleConflictGroup.Contract,
        @Inject(ROLE_CONFLICT_GROUP_HANDLER)
        private readonly roleConflictGroupHandler: Handlers.RoleConflictGroup.Contract,
        i18nService: I18nService,
    ) {
        super(i18nService);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a role-conflict-group by identifier" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: RoleConflictGroupDTO })
    public getById(@Query() { group, realm, view }: GetRoleConflictGroupByIdQueryDTO): Promise<RoleConflictGroupDTO> {
        return this.roleConflictGroupRepository
            .findUniqueOrThrow({ options: { populate: this.populate[view] }, where: { id: group, realm } })
            .then((data) => super.formatResponse({ DTO: RoleConflictGroupDTO, data }));
    }

    @Post("list")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a paginated list of role-conflict-groups" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: RoleConflictGroupPaginatedListDTO })
    public getList(
        @Query() { realm, view }: GetRoleConflictGroupsListQueryDTO,
        @Body() { pagination, filters, sort }: GetRoleConflictGroupsListBodyDTO,
    ): Promise<RoleConflictGroupPaginatedListDTO> {
        return this.roleConflictGroupRepository
            .findMany({ options: { populate: this.populate[view] }, pagination, filters, sort, realm })
            .then((data) => super.formatResponse({ DTO: RoleConflictGroupPaginatedListDTO, pagination, data }));
    }

    @Post("violation-details")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a list of SoD violation-details" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: RoleConflictGroupListDTO })
    public findViolationDetails(
        @Query() { realm }: GetViolationDetailsQueryDTO,
        @Body() { account, roles }: GetViolationDetailsBodyDTO,
    ): Promise<RoleConflictGroupListDTO> {
        return this.roleConflictGroupRepository
            .findViolationDetails({ account, roles, realm })
            .then((data) => super.formatResponse({ DTO: RoleConflictGroupListDTO, data: { data } }));
    }

    @Post("create")
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: "Creates a new role-conflict-group assignment" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    public create(
        @ExtractContext() context: RequestContext,
        @Query() { realm }: CreateRoleConflictGroupQueryDTO,
        @Body() input: CreateRoleConflictGroupBodyDTO,
    ): Promise<SuccessMessageDTO> {
        return this.roleConflictGroupHandler
            .create({ actor: "00000000-0000-4000-8000-000000000000", input, context, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data }));
    }

    @Patch("update")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Updates role-conflict-group metadata" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    public updateMetadata(
        @ExtractContext() context: RequestContext,
        @Query() { realm, id }: UpdateRoleConflictGroupQueryDTO,
        @Body() input: UpdateRoleConflictGroupBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.roleConflictGroupHandler
            .update({ input, context, realm, actor: "00000000-0000-4000-8000-000000000000", id })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Patch("revoke")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Revokes a non-system role-conflict-group assignment/s" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    public revoke(
        @ExtractContext() context: RequestContext,
        @Query() { realm }: RevokeRoleConflictGroupQueryDTO,
        @Body() input: RevokeRoleConflictGroupBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.roleConflictGroupHandler
            .revoke({ actor: "00000000-0000-4000-8000-000000000000", input, context, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Patch("restore")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Restores a non-system role-conflict-group assignment/s" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    public restore(
        @ExtractContext() context: RequestContext,
        @Query() { realm }: RestoreRoleConflictGroupQueryDTO,
        @Body() input: RestoreRoleConflictGroupBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.roleConflictGroupHandler
            .restore({ actor: "00000000-0000-4000-8000-000000000000", input, context, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Delete("purge")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Permanently deletes a revoked non-system role-conflict-group assignment/s" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    public purge(
        @ExtractContext() context: RequestContext,
        @Query() { realm }: PurgeRoleConflictGroupQueryDTO,
        @Body() input: PurgeRoleConflictGroupBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.roleConflictGroupHandler
            .purge({ actor: "00000000-0000-4000-8000-000000000000", input, context, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }
}
