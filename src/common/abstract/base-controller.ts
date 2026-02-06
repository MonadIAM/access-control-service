import { plainToInstance } from "class-transformer";
import { isString } from "class-validator";
import { I18nService } from "nestjs-i18n";

export class BaseController {
    protected constructor(protected readonly i18n: I18nService) {}

    protected async formatResponse<T>({
        pagination,
        lang,
        data,
        DTO,
    }: BaseController.FormatServiceResponse<T>): Promise<T> {
        const isPaginated = Array.isArray(data) && typeof data[1] === "number";
        const resultData = isPaginated ? data[0] : data;
        const count = isPaginated ? data[1] : 0;

        if (isString(resultData.message)) {
            resultData.message = await this.i18n.translate(resultData.message, {
                defaultValue: resultData.message,
                args: resultData.params ?? {},
                lang: lang,
            });
        }

        const response = pagination
            ? {
                  data: resultData,
                  meta: {
                      totalPages: Math.ceil(count / (pagination.elementsPerPage ?? 10)),
                      elementsPerPage: pagination.elementsPerPage ?? 10,
                      currentPage: pagination.currentPage ?? 1,
                      totalElements: count,
                  },
              }
            : resultData;

        return plainToInstance(DTO, response, {
            enableImplicitConversion: true,
            excludeExtraneousValues: true,
        });
    }
}
