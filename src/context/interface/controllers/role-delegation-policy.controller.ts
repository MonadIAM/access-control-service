import { Body, Controller, HttpStatus, Post, HttpCode, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { I18nService } from "nestjs-i18n";

import { RoleDelegationPolicyRepository } from "~context/infrastructure";
import { ErrorResponseBodyDTO } from "~common/dto";
import { BaseController } from "~common/abstract";

import {
    GetRoleDelegationPoliciesListQueryDTO,
    GetRoleDelegationPoliciesListBodyDTO,
    GetRoleDelegationPolicyByIdQueryDTO,
    RoleDelegationPolicyListDTO,
    RoleDelegationPolicyDTO,
} from "../dto/role-delegation-policy";

@ApiTags("RoleDelegationPolicy")
@Controller("/role-delegation-policy")
export class RoleDelegationPolicyController extends BaseController {
    private readonly populate = {
        DETAILED: ["delegator", "target", "realm"] as const,
        COMPACT: [] as const,
    };

    public constructor(
        private readonly roleDelegationPolicyRepository: RoleDelegationPolicyRepository,
        i18nService: I18nService,
    ) {
        super(i18nService);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a role-delegation-policy by identifier" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: RoleDelegationPolicyDTO })
    public getById(
        @Query() { policy, realm, view }: GetRoleDelegationPolicyByIdQueryDTO,
    ): Promise<RoleDelegationPolicyDTO> {
        return this.roleDelegationPolicyRepository
            .findUniqueOrThrow({ options: { populate: this.populate[view] }, where: { id: policy, realm } })
            .then((data) => super.formatResponse({ DTO: RoleDelegationPolicyDTO, data }));
    }

    @Post("list")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a paginated list of role-delegation-policies" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: RoleDelegationPolicyListDTO })
    public getList(
        @Query() { realm, view }: GetRoleDelegationPoliciesListQueryDTO,
        @Body() { pagination, filters, sort }: GetRoleDelegationPoliciesListBodyDTO,
    ): Promise<RoleDelegationPolicyListDTO> {
        return this.roleDelegationPolicyRepository
            .findMany({ options: { populate: this.populate[view] }, pagination, filters, sort, realm })
            .then((data) => super.formatResponse({ DTO: RoleDelegationPolicyListDTO, pagination, data }));
    }
}
