import { NestFastifyApplication } from "@nestjs/platform-fastify";
import { HttpStatus } from "@nestjs/common";
import fastifyHelmet from "@fastify/helmet";
import fastifyCors from "@fastify/cors";

export abstract class BootstrapSecurity {
    private constructor() {}

    /**
     * Точка входа регистрации security-политик.
     *
     * @param application Экземпляр Nest Fastify-приложения.
     */
    public static async registerSecurityPlugins(application: NestFastifyApplication): Promise<void> {
        this.enforceAllowedOrigins(application);
        await this.configureCrossOriginResourceSharing(application);
        await this.configureSecurityHeaders(application);
        this.removeServerHeader(application);
        this.blockUnsafeHttpMethods(application);
    }

    /**
     * Устанавливает CORS (Cross-origin resource sharing) заголовки с проверкой ALLOWED_ORIGINS.
     * @note Это разрешает кросс-доменные запросы только от доверенных источников. (no-origin только в dev режиме)
     *
     * @param application Экземпляр Nest Fastify-приложения. {@link NestFastifyApplication}
     *
     * @see CORS [Cross-Origin Resource Sharing](https://developer.mozilla.org/docs/Web/HTTP/CORS)
     */
    private static enforceAllowedOrigins(application: NestFastifyApplication): void {
        const allowedOrigins: string[] = JSON.parse(process.env.ALLOWED_ORIGINS ?? "[]");
        const isDevelopment: boolean = (process.env.NODE_ENV ?? "development") === "development";

        application
            .getHttpAdapter()
            .getInstance()
            .addHook("onRequest", (request, reply, done) => {
                const originHeader = request.headers["origin"] as string | undefined;
                if (originHeader) {
                    const isAllowed: boolean = allowedOrigins.length === 0 || allowedOrigins.includes(originHeader);
                    if (isAllowed) {
                        done();
                    } else {
                        const body: Exception.ResponseBody = {
                            statusCode: HttpStatus.FORBIDDEN,
                            error: "Forbidden",
                            message: `CORS origin is not allowed: ${originHeader}`,
                            timestamp: new Date().toISOString(),
                            path: request.url,
                        };
                        reply.code(HttpStatus.FORBIDDEN).type("application/json; charset=utf-8").send(body);
                    }
                } else if (isDevelopment) {
                    done();
                } else {
                    const body: Exception.ResponseBody = {
                        statusCode: HttpStatus.FORBIDDEN,
                        error: "Forbidden",
                        message: "CORS origin is required",
                        timestamp: new Date().toISOString(),
                        path: request.url,
                    };
                    reply.code(HttpStatus.FORBIDDEN).type("application/json; charset=utf-8").send(body);
                }
            });
    }

    /**
     * Регистрация fastify-cors.
     *
     * @note Этот метод зависит от предварительной фильтрации в {@link enforceAllowedOrigins}.
     * Либеральная настройка (callback(null, true)) допустима только потому, что невалидные запросы отсекаются на этапе onRequest.
     *
     * @param application Экземпляр Nest Fastify-приложения. {@link NestFastifyApplication}
     */
    private static async configureCrossOriginResourceSharing(application: NestFastifyApplication): Promise<void> {
        await application.register(fastifyCors, {
            origin: (_origin, callback) => callback(null, true),
            credentials: true,
        });
    }

    /**
     * Устанавливает CSP, HSTS, COEP, COOP, CORP, nosniff заголовки.
     *
     * @param application Экземпляр Nest Fastify-приложения. {@link NestFastifyApplication}
     *
     * @see CSP [Content Security Policy](https://developer.mozilla.org/docs/Web/HTTP/Guides/CSP)
     * @see HSTS [Strict Transport Security](https://developer.mozilla.org/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security)
     * @see CEOP [Cross-Origin Embedder Policy](https://developer.mozilla.org/docs/Web/HTTP/Headers/Cross-Origin-Embedder-Policy)
     * @see COOP [Cross-Origin Opener Policy](https://developer.mozilla.org/docs/Web/HTTP/Headers/Cross-Origin-Opener-Policy)
     * @see CORP [Cross-Origin Resource Policy](https://developer.mozilla.org/docs/Web/HTTP/Headers/Cross-Origin-Resource-Policy)
     * @see OWASP [Secure Headers Project](https://owasp.org/www-community/OWASP_Secure_Headers_Project#x-content-type-options)
     */
    private static async configureSecurityHeaders(application: NestFastifyApplication): Promise<void> {
        await application.register(fastifyHelmet, {
            crossOriginEmbedderPolicy: true,
            crossOriginOpenerPolicy: { policy: "same-origin" },
            crossOriginResourcePolicy: { policy: "same-origin" },
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "validator.swagger.io"],
                    scriptSrc: ["'self'", "https:", "'unsafe-inline'"],
                    upgradeInsecureRequests: [],
                },
            },
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true,
            },
            noSniff: true,
        });
    }

    /**
     * Убирает заголовок Server.
     *
     * @note Это снижает раскрытие информации о серверном ПО.
     *
     * @param application Экземпляр Nest Fastify-приложения. {@link NestFastifyApplication}
     *
     * @see OWASP [Secure Headers Project](https://owasp.org/www-project-secure-headers/#server)
     */
    private static removeServerHeader(application: NestFastifyApplication): void {
        application
            .getHttpAdapter()
            .getInstance()
            .addHook("onSend", (_request, reply, payload, done) => {
                reply.header("X-Powered-By", undefined);
                reply.header("server", undefined);
                done(null, payload);
            });
    }

    /**
     * Блокирует HTTP методы TRACE и TRACK.
     *
     * @note Это предотвращает XST (Cross-Site Tracing) атаки.
     *
     * @param application Экземпляр Nest Fastify-приложения. {@link NestFastifyApplication}
     *
     * @see XST [Cross-Site Tracing](https://owasp.org/www-community/attacks/Cross_Site_Tracing)
     */
    private static blockUnsafeHttpMethods(application: NestFastifyApplication): void {
        application
            .getHttpAdapter()
            .getInstance()
            .addHook("onRequest", (request, reply, done) => {
                const method = String(request.method ?? "").toUpperCase();
                if (method === "TRACE" || method === "TRACK") {
                    const body: Exception.ResponseBody = {
                        statusCode: HttpStatus.METHOD_NOT_ALLOWED,
                        error: "Method Not Allowed",
                        message: `HTTP method is not allowed: ${method}`,
                        timestamp: new Date().toISOString(),
                        path: request.url,
                    };
                    reply.code(HttpStatus.METHOD_NOT_ALLOWED).type("application/json; charset=utf-8").send(body);
                    return;
                }
                done();
            });
    }
}
