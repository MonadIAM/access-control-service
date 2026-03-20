import { UseInterceptors, Controller, HttpStatus, HttpCode, Delete, Inject, Query, Body, Post, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { I18nLang as Lang, I18nService } from "nestjs-i18n";

import { EndpointExceptions, ExtractActor, ExtractContext, RequirePermission } from "~common/decorators";
import { ROLE_CONFLICT_MEMBER_REPOSITORY } from "~context/infrastructure/repositories";
import { ROLE_CONFLICT_MEMBER_OPERATION } from "~context/application/operations";
import { MonitoringInterceptor } from "~common/interceptors";
import { BaseController } from "~common/abstract";
import { SuccessMessageDTO } from "~common/dto";
import { PermissionCode } from "~context/enums";

import {
    GetRoleConflictMembersListQueryDTO,
    GetRoleConflictMembersListBodyDTO,
    GetRoleConflictMemberByIdQueryDTO,
    CreateRoleConflictMemberQueryDTO,
    CreateRoleConflictMemberBodyDTO,
    PurgeRoleConflictMemberQueryDTO,
    PurgeRoleConflictMemberBodyDTO,
    RoleConflictMemberListDTO,
    RoleConflictMemberDTO,
} from "../dto/role-conflict-member";

@ApiTags("RoleConflictMember")
@Controller("/role-conflict-member")
@UseInterceptors(MonitoringInterceptor)
export class RoleConflictMemberController extends BaseController {
    private readonly populate = {
        DETAILED: ["group", "role"] as const,
        COMPACT: [] as const,
    };

    public constructor(
        @Inject(ROLE_CONFLICT_MEMBER_REPOSITORY)
        private readonly roleConflictMemberRepository: Repositories.RoleConflictMember.Contract,
        @Inject(ROLE_CONFLICT_MEMBER_OPERATION)
        private readonly roleConflictMemberOperation: Operations.RoleConflictMember.Contract,
        i18nService: I18nService,
    ) {
        super(i18nService);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @RequirePermission(PermissionCode.ROLE_CONFLICT_MEMBER_READ)
    @ApiOperation({ summary: "Returns a role conflict member by identifier" })
    @ApiResponse({ status: HttpStatus.OK, type: RoleConflictMemberDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.NOT_FOUND)
    public getById(
        @Query() { member, group, realm, view }: GetRoleConflictMemberByIdQueryDTO,
    ): Promise<RoleConflictMemberDTO> {
        return this.roleConflictMemberRepository
            .findUniqueOrThrow({
                options: { populate: this.populate[view] },
                where: { id: member, group: { id: group, realm } },
            })
            .then((data) => super.formatResponse({ DTO: RoleConflictMemberDTO, data }));
    }

    @Post("list")
    @HttpCode(HttpStatus.OK)
    @RequirePermission(PermissionCode.ROLE_CONFLICT_MEMBER_READ)
    @ApiOperation({ summary: "Returns a paginated list of role conflict members" })
    @ApiResponse({ status: HttpStatus.OK, type: RoleConflictMemberListDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY)
    public getList(
        @Query() { group, realm, view }: GetRoleConflictMembersListQueryDTO,
        @Body() { pagination, filters, sort }: GetRoleConflictMembersListBodyDTO,
    ): Promise<RoleConflictMemberListDTO> {
        return this.roleConflictMemberRepository
            .findMany({ options: { populate: this.populate[view] }, pagination, filters, sort, group, realm })
            .then((data) => super.formatResponse({ DTO: RoleConflictMemberListDTO, pagination, data }));
    }

    @Post("create")
    @HttpCode(HttpStatus.CREATED)
    @RequirePermission(PermissionCode.ROLE_CONFLICT_MEMBER_CREATE)
    @ApiOperation({ summary: "Creates a new role conflict member/s" })
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
        @Query() { realm }: CreateRoleConflictMemberQueryDTO,
        @Body() input: CreateRoleConflictMemberBodyDTO,
    ): Promise<SuccessMessageDTO> {
        return this.roleConflictMemberOperation
            .create({ actor, context, input, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data }));
    }

    @Delete("purge")
    @HttpCode(HttpStatus.OK)
    @RequirePermission(PermissionCode.ROLE_CONFLICT_MEMBER_PURGE)
    @ApiOperation({ summary: "Permanently deletes a revoked non-system role conflict member/s" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public purge(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm }: PurgeRoleConflictMemberQueryDTO,
        @Body() input: PurgeRoleConflictMemberBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.roleConflictMemberOperation
            .purge({ actor, context, input, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }
}
