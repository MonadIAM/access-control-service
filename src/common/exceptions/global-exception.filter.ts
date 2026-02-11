import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { FastifyRequest, FastifyReply } from "fastify";
import { I18nContext, I18nService } from "nestjs-i18n";
import { ThrottlerException } from "@nestjs/throttler";
import { Counter } from "prom-client";

import { RepositoryException } from "./types/repository.exception";
import { BaseException } from "./types/base.exception";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    public constructor(
        @InjectMetric("app_unhandled_errors_total") private readonly unhandledErrorsCounter: Counter<string>,
        private readonly i18n: I18nService,
    ) {}

    public async catch(exception: unknown, host: ArgumentsHost): Promise<void> {
        const context = host.switchToHttp();
        const response = context.getResponse<FastifyReply>();
        const request = context.getRequest<FastifyRequest>();

        const i18n = I18nContext.current(host);
        const lang = i18n?.lang ?? "en";

        const result: Partial<Exception.ResponseBody> = {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: "Internal Server Error",
            error: "InternalServerError",
        };

        if (exception instanceof BaseException) {
            result.statusCode = exception.statusCode;
            result.timestamp = exception.timestamp;
            result.message = await this.i18n.translate(exception.message, {
                defaultValue: exception.message,
                args: exception.params,
                lang: lang,
            });

            let details: Optional<Exception.ValidationDetail[]>;
            if (exception.details) {
                details = await Promise.all(
                    exception.details.map(async (element) => ({
                        ...element,
                        message: await this.i18n.translate(element.message, {
                            args: { ...element.args, property: element.path.split(".").pop() },
                            defaultValue: element.message,
                            lang,
                        }),
                    })),
                );
            }
            result.error = exception.kind;
            result.details = details;
        } else if (exception instanceof ThrottlerException) {
            result.statusCode = exception.getStatus();
            result.message = await this.i18n.translate(exception.message, {
                defaultValue: exception.message,
                lang,
            });
            result.error = exception.name;
        } else if (exception instanceof HttpException) {
            result.statusCode = exception.getStatus();
            const response = exception.getResponse();

            if (typeof response === "string") {
                result.message = response;
                result.error = exception.name;
            } else if (response && typeof response === "object") {
                const { message, error, details } = response as Partial<Exception.ResponseBody>;
                result.message = message;
                result.details = details;
                result.error = typeof error === "string" ? error : exception.name;
            } else {
                result.error = exception.name;
            }
        } else if (exception instanceof Error) {
            result.message = exception.message;
            result.error = exception.name;
        }

        const logPayload = {
            path: request.url,
            method: request.method,
            statusCode: result.statusCode,
        };

        if (result.statusCode !== 404) {
            if (exception instanceof ThrottlerException) {
                this.unhandledErrorsCounter.inc({ type: "Throttling" });
            } else if (exception instanceof RepositoryException) {
                this.unhandledErrorsCounter.inc({ type: "Database" });
            } else if (result.statusCode! >= 500) {
                this.unhandledErrorsCounter.inc({ type: "Internal" });
            }
        }

        if (result.statusCode! >= 500) {
            this.logger.error({ ...logPayload, err: exception }, "Internal Server Error");
        } else {
            this.logger.warn({ ...logPayload, kind: result.error }, "Client Error");
        }

        const body: Partial<Exception.ResponseBody> = {
            timestamp: new Date().toISOString(),
            path: request.url,
            ...result,
        };

        response.status(body.statusCode!).send(body);
    }
}
