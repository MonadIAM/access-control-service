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

import { ROLE_DELEGATION_POLICY_REPOSITORY } from "~context/infrastructure/repositories";
import { ROLE_DELEGATION_POLICY_HANDLER } from "~context/application/handlers";
import { EndpointExceptions, ExtractContext } from "~common/decorators";
import { MonitoringInterceptor } from "~common/interceptors";
import { BaseController } from "~common/abstract";
import { SuccessMessageDTO } from "~common/dto";

import {
    GetRoleDelegationPoliciesListQueryDTO,
    GetRoleDelegationPoliciesListBodyDTO,
    GetRoleDelegationPolicyByIdQueryDTO,
    RestoreRoleDelegationPolicyQueryDTO,
    RestoreRoleDelegationPolicyBodyDTO,
    RevokeRoleDelegationPolicyQueryDTO,
    CreateRoleDelegationPolicyQueryDTO,
    UpdateRoleDelegationPolicyQueryDTO,
    UpdateRoleDelegationPolicyBodyDTO,
    RevokeRoleDelegationPolicyBodyDTO,
    CreateRoleDelegationPolicyBodyDTO,
    PurgeRoleDelegationPolicyQueryDTO,
    PurgeRoleDelegationPolicyBodyDTO,
    RoleDelegationPolicyListDTO,
    RoleDelegationPolicyDTO,
} from "../dto/role-delegation-policy";

@ApiTags("RoleDelegationPolicy")
@Controller("/role-delegation-policy")
@UseInterceptors(MonitoringInterceptor)
export class RoleDelegationPolicyController extends BaseController {
    private readonly populate = {
        DETAILED: ["delegator", "target", "realm"] as const,
        COMPACT: [] as const,
    };

    public constructor(
        @Inject(ROLE_DELEGATION_POLICY_REPOSITORY)
        private readonly roleDelegationPolicyRepository: Repositories.RoleDelegationPolicy.Contract,
        @Inject(ROLE_DELEGATION_POLICY_HANDLER)
        private readonly roleDelegationPolicyHandler: Handlers.RoleDelegationPolicy.Contract,
        i18nService: I18nService,
    ) {
        super(i18nService);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a role delegation policy by identifier" })
    @ApiResponse({ status: HttpStatus.OK, type: RoleDelegationPolicyDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.NOT_FOUND)
    public getById(
        @Query() { policy, realm, view }: GetRoleDelegationPolicyByIdQueryDTO,
    ): Promise<RoleDelegationPolicyDTO> {
        return this.roleDelegationPolicyRepository
            .findUniqueOrThrow({ options: { populate: this.populate[view] }, where: { id: policy, realm } })
            .then((data) => super.formatResponse({ DTO: RoleDelegationPolicyDTO, data }));
    }

    @Post("list")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a paginated list of role delegation policies" })
    @ApiResponse({ status: HttpStatus.OK, type: RoleDelegationPolicyListDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY)
    public getList(
        @Query() { realm, view }: GetRoleDelegationPoliciesListQueryDTO,
        @Body() { pagination, filters, sort }: GetRoleDelegationPoliciesListBodyDTO,
    ): Promise<RoleDelegationPolicyListDTO> {
        return this.roleDelegationPolicyRepository
            .findMany({ options: { populate: this.populate[view] }, pagination, filters, sort, realm })
            .then((data) => super.formatResponse({ DTO: RoleDelegationPolicyListDTO, pagination, data }));
    }

    @Post("create")
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: "Creates a new role delegation policy" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(
        HttpStatus.INTERNAL_SERVER_ERROR,
        HttpStatus.UNPROCESSABLE_ENTITY,
        HttpStatus.BAD_REQUEST,
        HttpStatus.CONFLICT,
    )
    public create(
        @ExtractContext() context: RequestContext,
        @Query() { realm }: CreateRoleDelegationPolicyQueryDTO,
        @Body() input: CreateRoleDelegationPolicyBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.roleDelegationPolicyHandler
            .create({ actor: "00000000-0000-4000-8000-000000000000", input, context, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Patch("update")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Updates role delegation policy data" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public updateMetadata(
        @ExtractContext() context: RequestContext,
        @Query() { realm, id }: UpdateRoleDelegationPolicyQueryDTO,
        @Body() input: UpdateRoleDelegationPolicyBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.roleDelegationPolicyHandler
            .update({ input, context, realm, actor: "00000000-0000-4000-8000-000000000000", id })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Patch("revoke")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Revokes a non-system role delegation policies" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    public revoke(
        @ExtractContext() context: RequestContext,
        @Query() { realm }: RevokeRoleDelegationPolicyQueryDTO,
        @Body() input: RevokeRoleDelegationPolicyBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.roleDelegationPolicyHandler
            .revoke({ actor: "00000000-0000-4000-8000-000000000000", input, context, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Patch("restore")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Restores a non-system role delegation policies" })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    public restore(
        @ExtractContext() context: RequestContext,
        @Query() { realm }: RestoreRoleDelegationPolicyQueryDTO,
        @Body() input: RestoreRoleDelegationPolicyBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.roleDelegationPolicyHandler
            .restore({ actor: "00000000-0000-4000-8000-000000000000", input, context, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Delete("purge")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Permanently deletes a revoked non-system role delegation policies" })
    @EndpointExceptions(HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, HttpStatus.BAD_REQUEST)
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    public purge(
        @ExtractContext() context: RequestContext,
        @Query() { realm }: PurgeRoleDelegationPolicyQueryDTO,
        @Body() input: PurgeRoleDelegationPolicyBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.roleDelegationPolicyHandler
            .purge({ actor: "00000000-0000-4000-8000-000000000000", input, context, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }
}
