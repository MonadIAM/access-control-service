import { Body, Controller, HttpStatus, Post, HttpCode, Get, Query, UseInterceptors } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { I18nService } from "nestjs-i18n";

import { AccountRoleMatrixRepository } from "~context/infrastructure/repositories";
import { MonitoringInterceptor } from "~common/interceptors";
import { ErrorResponseBodyDTO } from "~common/dto";
import { BaseController } from "~common/abstract";

import {
    GetAccountRoleMatricesListQueryDTO,
    GetAccountRoleMatricesListBodyDTO,
    GetAccountRoleMatrixByIdQueryDTO,
    AccountRoleMatrixListDTO,
    AccountRoleMatrixDTO,
} from "../dto/account-role-matrix";

@ApiTags("AccountRoleMatrix")
@Controller("/account-role-matrix")
@UseInterceptors(MonitoringInterceptor)
export class AccountRoleMatrixController extends BaseController {
    private readonly populate = {
        DETAILED: ["realm", "role"] as const,
        COMPACT: [] as const,
    };

    public constructor(
        private readonly accountRoleMatrixRepository: AccountRoleMatrixRepository,
        i18nService: I18nService,
    ) {
        super(i18nService);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a account-role-matrix by identifier" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: AccountRoleMatrixDTO })
    public getById(@Query() { matrix, realm, view }: GetAccountRoleMatrixByIdQueryDTO): Promise<AccountRoleMatrixDTO> {
        return this.accountRoleMatrixRepository
            .findUniqueOrThrow({ options: { populate: this.populate[view] }, where: { id: matrix, realm } })
            .then((data) => super.formatResponse({ DTO: AccountRoleMatrixDTO, data }));
    }

    @Post("list")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a paginated list of account-role-matrices" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseBodyDTO })
    @ApiResponse({ status: HttpStatus.OK, type: AccountRoleMatrixListDTO })
    public getList(
        @Query() { realm, view }: GetAccountRoleMatricesListQueryDTO,
        @Body() { pagination, filters, sort }: GetAccountRoleMatricesListBodyDTO,
    ): Promise<AccountRoleMatrixListDTO> {
        return this.accountRoleMatrixRepository
            .findMany({ options: { populate: this.populate[view] }, pagination, filters, sort, realm })
            .then((data) => super.formatResponse({ DTO: AccountRoleMatrixListDTO, pagination, data }));
    }
}
