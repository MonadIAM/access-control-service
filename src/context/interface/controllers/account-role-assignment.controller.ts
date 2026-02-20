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

import { ACCOUNT_ROLE_ASSIGNMENT_REPOSITORY } from "~context/infrastructure/repositories";
import { ACCOUNT_ROLE_ASSIGNMENT_HANDLER } from "~context/application/handlers";
import { ErrorResponseBodyDTO, SuccessMessageDTO } from "~common/dto";
import { MonitoringInterceptor } from "~common/interceptors";
import { ExtractContext } from "~common/decorators";
import { BaseController } from "~common/abstract";

import {
    GetAccountRoleAssignmentsListQueryDTO,
    GetAccountRoleAssignmentsListBodyDTO,
    GetAccountRoleAssignmentByIdQueryDTO,
    RestoreAccountRoleAssignmentQueryDTO,
    RestoreAccountRoleAssignmentBodyDTO,
    RevokeAccountRoleAssignmentQueryDTO,
    RevokeAccountRoleAssignmentBodyDTO,
    CreateAccountRoleAssignmentQueryDTO,
    CreateAccountRoleAssignmentBodyDTO,
    PurgeAccountRoleAssignmentQueryDTO,
    PurgeAccountRoleAssignmentBodyDTO,
    AccountRoleAssignmentListDTO,
    AccountRoleAssignmentDTO,
} from "../dto/account-role-assignment";

@ApiTags("AccountRoleAssignment")
@Controller("/account-role-assignment")
@UseInterceptors(MonitoringInterceptor)
export class AccountRoleAssignmentController extends BaseController {
    private readonly populate = {
        DETAILED: ["realm", "role"] as const,
        COMPACT: [] as const,
    };

    public constructor(
        @Inject(ACCOUNT_ROLE_ASSIGNMENT_REPOSITORY)
        private readonly accountRoleAssignmentRepository: Repositories.AccountRoleAssignment.Contract,
        @Inject(ACCOUNT_ROLE_ASSIGNMENT_HANDLER)
        private readonly accountRoleAssignmentHandler: Handlers.AccountRoleAssignment.Contract,
        i18nService: I18nService,
    ) {
        super(i18nService);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a account-role-assignment by identifier" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: AccountRoleAssignmentDTO })
    public getById(
        @Query() { assignment, realm, view }: GetAccountRoleAssignmentByIdQueryDTO,
    ): Promise<AccountRoleAssignmentDTO> {
        return this.accountRoleAssignmentRepository
            .findUniqueOrThrow({ options: { populate: this.populate[view] }, where: { id: assignment, realm } })
            .then((data) => super.formatResponse({ DTO: AccountRoleAssignmentDTO, data }));
    }

    @Post("list")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a paginated list of account-role-assignments" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: AccountRoleAssignmentListDTO })
    public getList(
        @Query() { realm, view }: GetAccountRoleAssignmentsListQueryDTO,
        @Body() { pagination, filters, sort }: GetAccountRoleAssignmentsListBodyDTO,
    ): Promise<AccountRoleAssignmentListDTO> {
        return this.accountRoleAssignmentRepository
            .findMany({ options: { populate: this.populate[view] }, pagination, filters, sort, realm })
            .then((data) => super.formatResponse({ DTO: AccountRoleAssignmentListDTO, pagination, data }));
    }

    @Post("create")
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: "Creates a new account-role assignment" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    public create(
        @ExtractContext() context: RequestContext,
        @Query() { realm }: CreateAccountRoleAssignmentQueryDTO,
        @Body() input: CreateAccountRoleAssignmentBodyDTO,
    ): Promise<SuccessMessageDTO> {
        return this.accountRoleAssignmentHandler
            .create({ actor: "00000000-0000-4000-8000-000000000000", input, context, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data }));
    }

    @Patch("revoke")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Revokes a non-system account-role assignment/s" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    public revoke(
        @ExtractContext() context: RequestContext,
        @Query() { realm }: RevokeAccountRoleAssignmentQueryDTO,
        @Body() input: RevokeAccountRoleAssignmentBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.accountRoleAssignmentHandler
            .revoke({ actor: "00000000-0000-4000-8000-000000000000", input, context, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Patch("restore")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Restores a non-system account-role assignment/s" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    public restore(
        @ExtractContext() context: RequestContext,
        @Query() { realm }: RestoreAccountRoleAssignmentQueryDTO,
        @Body() input: RestoreAccountRoleAssignmentBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.accountRoleAssignmentHandler
            .restore({ actor: "00000000-0000-4000-8000-000000000000", input, context, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Delete("purge")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Permanently deletes a revoked non-system account-role assignment/s" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    public purge(
        @ExtractContext() context: RequestContext,
        @Query() { realm }: PurgeAccountRoleAssignmentQueryDTO,
        @Body() input: PurgeAccountRoleAssignmentBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.accountRoleAssignmentHandler
            .purge({ actor: "00000000-0000-4000-8000-000000000000", input, context, realm })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }
}
