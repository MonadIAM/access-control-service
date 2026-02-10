import { Body, Controller, HttpStatus, Post, HttpCode, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { I18nService } from "nestjs-i18n";

import { RoleConflictMemberRepository } from "~context/infrastructure/repositories";
import { BaseReadQueryDTO, ErrorResponseBodyDTO } from "~common/dto";
import { BaseController } from "~common/abstract";

import {
    GetRoleConflictMembersListBodyDTO,
    GetRoleConflictMemberByIdQueryDTO,
    RoleConflictMemberListDTO,
    RoleConflictMemberDTO,
} from "../dto/role-conflict-member";

@ApiTags("RoleConflictMember")
@Controller("/role-conflict-member")
export class RoleConflictMemberController extends BaseController {
    private readonly populate = {
        DETAILED: ["group", "role"] as const,
        COMPACT: [] as const,
    };

    public constructor(
        private readonly roleConflictMemberRepository: RoleConflictMemberRepository,
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
}
