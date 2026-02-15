import { Body, Controller, HttpStatus, Post, HttpCode, Get, Query, UseInterceptors, Inject } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { I18nService } from "nestjs-i18n";

import { ACCOUNT_ROLE_ASSIGNMENT_REPOSITORY } from "~context/infrastructure/repositories";
import { MonitoringInterceptor } from "~common/interceptors";
import { ErrorResponseBodyDTO } from "~common/dto";
import { BaseController } from "~common/abstract";

import {
    GetAccountRoleAssignmentsListQueryDTO,
    GetAccountRoleAssignmentsListBodyDTO,
    GetAccountRoleAssignmentByIdQueryDTO,
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
}
