import { UseInterceptors, Controller, HttpStatus, HttpCode, Delete, Inject, Query, Body, Post, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { I18nLang as Lang, I18nService } from "nestjs-i18n";

import { BaseReadQueryDTO, ErrorResponseBodyDTO, SuccessMessageDTO } from "~common/dto";
import { ROLE_CONFLICT_MEMBER_REPOSITORY } from "~context/infrastructure/repositories";
import { ROLE_CONFLICT_MEMBER_HANDLER } from "~context/application/handlers";
import { MonitoringInterceptor } from "~common/interceptors";
import { ExtractContext } from "~common/decorators";
import { BaseController } from "~common/abstract";

import {
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
        @Inject(ROLE_CONFLICT_MEMBER_HANDLER)
        private readonly roleConflictMemberHandler: Handlers.RoleConflictMember.Contract,
        i18nService: I18nService,
    ) {
        super(i18nService);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a role-conflict-member by identifier" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: RoleConflictMemberDTO })
    public getById(@Query() { member, view }: GetRoleConflictMemberByIdQueryDTO): Promise<RoleConflictMemberDTO> {
        return this.roleConflictMemberRepository
            .findUniqueOrThrow({ options: { populate: this.populate[view] }, where: { id: member } })
            .then((data) => super.formatResponse({ DTO: RoleConflictMemberDTO, data }));
    }

    @Post("list")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a paginated list of role-conflict-members" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: RoleConflictMemberListDTO })
    public getList(
        @Query() { view }: BaseReadQueryDTO,
        @Body() { pagination, filters, sort }: GetRoleConflictMembersListBodyDTO,
    ): Promise<RoleConflictMemberListDTO> {
        return this.roleConflictMemberRepository
            .findMany({ options: { populate: this.populate[view] }, pagination, filters, sort })
            .then((data) => super.formatResponse({ DTO: RoleConflictMemberListDTO, pagination, data }));
    }

    @Post("create")
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: "Creates a new role-conflict-member assignment" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    public create(
        @ExtractContext() context: RequestContext,
        @Query() { realm }: CreateRoleConflictMemberQueryDTO,
        @Body() input: CreateRoleConflictMemberBodyDTO,
    ): Promise<SuccessMessageDTO> {
        return this.roleConflictMemberHandler
            .create({ actor: "00000000-0000-4000-8000-000000000000", input, context, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data }));
    }

    @Delete("purge")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Permanently deletes a revoked non-system role-conflict-member assignment/s" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    public purge(
        @ExtractContext() context: RequestContext,
        @Query() { realm }: PurgeRoleConflictMemberQueryDTO,
        @Body() input: PurgeRoleConflictMemberBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.roleConflictMemberHandler
            .purge({ actor: "00000000-0000-4000-8000-000000000000", input, context, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }
}
