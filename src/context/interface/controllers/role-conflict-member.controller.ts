import { UseInterceptors, Controller, HttpStatus, HttpCode, Delete, Inject, Query, Body, Post, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { EndpointExceptions, ExtractActor, ExtractContext, FormatResponse, RequirePermission } from "~common/decorators";
import { ROLE_CONFLICT_MEMBER_REPOSITORY } from "~context/infrastructure/repositories";
import { ROLE_CONFLICT_MEMBER_OPERATION } from "~context/application/operations";
import { MonitoringInterceptor } from "~common/interceptors";
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
export class RoleConflictMemberController {
    private readonly populate = {
        DETAILED: ["group", "role"] as const,
        COMPACT: [] as const,
    };

    public constructor(
        @Inject(ROLE_CONFLICT_MEMBER_REPOSITORY)
        private readonly roleConflictMemberRepository: Repositories.RoleConflictMember.Contract,
        @Inject(ROLE_CONFLICT_MEMBER_OPERATION)
        private readonly roleConflictMemberOperation: Operations.RoleConflictMember.Contract,
    ) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    @FormatResponse(RoleConflictMemberDTO)
    @RequirePermission(PermissionCode.ROLE_CONFLICT_MEMBER_READ_ALL)
    @ApiOperation({ summary: "Returns a role conflict member by identifier" })
    @ApiResponse({ status: HttpStatus.OK, type: RoleConflictMemberDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.NOT_FOUND)
    public getById(
        @Query() { member, group, realm, view }: GetRoleConflictMemberByIdQueryDTO,
    ): Promise<Repositories.RoleConflictMember.Entity> {
        return this.roleConflictMemberRepository.findUniqueOrThrow({
            where: { id: member, group: { id: group, realm } },
            options: { populate: this.populate[view] },
        });
    }

    @Post("list")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(RoleConflictMemberListDTO)
    @RequirePermission(PermissionCode.ROLE_CONFLICT_MEMBER_READ_ALL)
    @ApiOperation({ summary: "Returns a paginated list of role conflict members" })
    @ApiResponse({ status: HttpStatus.OK, type: RoleConflictMemberListDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY)
    public getList(
        @Query() { group, realm, view }: GetRoleConflictMembersListQueryDTO,
        @Body() { pagination, filters, sort }: GetRoleConflictMembersListBodyDTO,
    ): Promise<[Repositories.RoleConflictMember.Entity[], number]> {
        return this.roleConflictMemberRepository.findMany({
            options: { populate: this.populate[view] },
            pagination,
            filters,
            group,
            realm,
            sort,
        });
    }

    @Post("create")
    @HttpCode(HttpStatus.CREATED)
    @FormatResponse(SuccessMessageDTO)
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
    ): Promise<MessageResult> {
        return this.roleConflictMemberOperation.create({ actor, context, input, realm });
    }

    @Delete("purge")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PermissionCode.ROLE_CONFLICT_MEMBER_PURGE)
    @ApiOperation({ summary: "Permanently deletes a revoked non-system role conflict member/s" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public purge(
        @ExtractActor() { account: actor }: ActorContext,
        @ExtractContext() context: RequestContext,
        @Query() { realm }: PurgeRoleConflictMemberQueryDTO,
        @Body() input: PurgeRoleConflictMemberBodyDTO,
    ): Promise<MessageResult> {
        return this.roleConflictMemberOperation.purge({ actor, context, input, realm });
    }
}
