import { ArgumentsHost, Catch, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { FastifyRequest, FastifyReply } from "fastify";
import { I18nContext, I18nService } from "nestjs-i18n";
import { ThrottlerException } from "@nestjs/throttler";

import { ErrorCode, ErrorKind } from "./enums";
import { Exception } from "./exception";

@Catch()
export class ExceptionFilter implements Exception.Filter.Contract {
    private readonly logger = new Logger(ExceptionFilter.name);

    public constructor(private readonly i18n: I18nService) {}

    public async catch(exception: unknown, host: ArgumentsHost): Promise<void> {
        const context = host.switchToHttp();
        const response = context.getResponse<FastifyReply>();
        const request = context.getRequest<FastifyRequest>();

        const i18n = I18nContext.current(host);
        const lang = i18n?.lang ?? "en";

        const result: Partial<Exception.ResponseBody> = {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: "Internal Server Error",
            error: ErrorKind.INTERNAL,
            code: ErrorCode.INTERNAL,
        };

        if (exception instanceof Exception && exception.kind !== ErrorKind.INTERNAL) {
            result.statusCode = exception.statusCode;
            result.timestamp = exception.timestamp;
            result.message = await this.i18n.translate(exception.messageKey, {
                defaultValue: exception.messageKey,
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
            result.code = exception.code;
            result.details = details;
        } else if (exception instanceof ThrottlerException) {
            result.statusCode = exception.getStatus();
            result.message = await this.i18n.translate(exception.message, {
                defaultValue: exception.message,
                lang,
            });
            result.error = exception.name;
            result.code = exception.name;
        } else if (exception instanceof HttpException) {
            result.statusCode = exception.getStatus();
            if (result.statusCode < HttpStatus.INTERNAL_SERVER_ERROR) {
                result.message = await this.i18n.translate(exception.message, {
                    defaultValue: exception.message,
                    lang,
                });
                result.error = exception.name;
                result.code = exception.name;
            }
        }

        this.log({ exception, request, result });

        const body: Partial<Exception.ResponseBody> = {
            timestamp: new Date().toISOString(),
            path: request.url,
            ...result,
        };

        if (exception instanceof Exception && exception.headers) {
            response.headers(exception.headers);
        }

        response.status(body.statusCode!).send(body);
    }

    public log(props: Exception.Filter.Log.Props): Exception.Filter.Log.Result {
        if (props.result.statusCode! >= HttpStatus.INTERNAL_SERVER_ERROR) {
            this.logger.error(
                {
                    statusCode: props.result.statusCode,
                    method: props.request.method,
                    kind: props.exception instanceof Exception ? props.exception.kind : undefined,
                    code: props.result.code,
                    path: props.request.url,
                    err: props.exception,
                },
                "Internal Error",
            );
        }
    }
}
