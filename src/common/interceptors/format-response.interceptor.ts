import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { I18nContext, I18nService } from "nestjs-i18n";
import { plainToInstance } from "class-transformer";
import { Observable, from, switchMap } from "rxjs";
import { isString } from "class-validator";
import { Reflector } from "@nestjs/core";

import { FORMAT_RESPONSE_DTO, SKIP_INTERCEPTORS } from "~common/decorators";

@Injectable()
export class FormatResponseInterceptor implements NestInterceptor {
    public constructor(
        private readonly reflector: Reflector,
        private readonly i18n: I18nService,
    ) {}

    public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const skip = this.reflector.getAllAndOverride<boolean>(SKIP_INTERCEPTORS, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (skip) {
            return next.handle();
        }

        const DTO = this.reflector.get(FORMAT_RESPONSE_DTO, context.getHandler());

        if (DTO) {
            const request = context.switchToHttp().getRequest();
            const lang = I18nContext.current(context)?.lang;
            const pagination = request.body?.pagination;

            return next.handle().pipe(switchMap((data) => from(this.formatResponse({ DTO, data, pagination, lang }))));
        } else {
            return next.handle();
        }
    }

    private async formatResponse<T>({ pagination, lang, data, DTO }: FormatResponse<T>): Promise<T> {
        const isTuple = Array.isArray(data) && typeof data[1] === "number";
        const resultData = isTuple ? data[0] : data;
        const count = isTuple ? data[1] : 0;

        if (isString(resultData.message)) {
            resultData.message = await this.i18n.translate(resultData.message, {
                defaultValue: resultData.message,
                args: resultData.params ?? {},
                lang,
            });
        }

        const response = pagination
            ? {
                  data: resultData,
                  meta: {
                      totalPages: Math.ceil(count / pagination.elementsPerPage),
                      elementsPerPage: pagination.elementsPerPage,
                      currentPage: pagination.currentPage,
                      totalElements: count,
                  },
              }
            : isTuple
              ? {
                    data: resultData,
                    meta: {
                        totalPages: 1,
                        elementsPerPage: count,
                        currentPage: 1,
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
