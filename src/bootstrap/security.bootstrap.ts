import { NestFastifyApplication } from "@nestjs/platform-fastify";
import { FastifyReply, FastifyRequest } from "fastify";
import fastifyHelmet from "@fastify/helmet";
import fastifyCors from "@fastify/cors";
import ms from "ms";

import { ErrorCode, Exception } from "~common/exceptions";
import { NodeEnv } from "~common/enums";

export abstract class BootstrapSecurity {
    private constructor() {}

    /**
     * Entry point for registering security policies.
     *
     * @param application Nest Fastify application instance.
     */
    public static async registerSecurityPlugins(application: NestFastifyApplication): Promise<void> {
        const hstsMaxAge = ms(process.env.HSTS_MAX_AGE) / 1e3;

        this.enforceAllowedOrigins(application);
        await this.configureCrossOriginResourceSharing(application);
        await this.configureSecurityHeaders(application, hstsMaxAge);
        this.removeServerHeader(application);
        this.blockUnsafeHttpMethods(application);
    }

    /**
     * Sets up CORS (Cross-Origin Resource Sharing) headers with ALLOWED_ORIGINS validation.
     * @note Allows cross-origin requests only from trusted sources. (no-origin allowed only in local mode)
     *
     * @param application Nest Fastify application instance. {@link NestFastifyApplication}
     *
     * @see CORS [Cross-Origin Resource Sharing](https://developer.mozilla.org/docs/Web/HTTP/CORS)
     */
    private static enforceAllowedOrigins(application: NestFastifyApplication): void {
        const serviceOrigins: string[] = JSON.parse(process.env.ALLOWED_SERVICE_ORIGINS);
        const uiOrigins: string[] = JSON.parse(process.env.ALLOWED_UI_ORIGINS);
        const allowedOrigins: string[] = serviceOrigins.concat(uiOrigins);
        const isLocal = process.env.NODE_ENV === NodeEnv.LOCAL;

        application
            .getHttpAdapter()
            .getInstance()
            .addHook("onRequest", (request, reply, done) => {
                const originHeader = request.headers["origin"] as Optional<string>;
                if (originHeader) {
                    const isAllowed: boolean = allowedOrigins.length === 0 || allowedOrigins.includes(originHeader);
                    if (isAllowed) {
                        done();
                    } else {
                        this.sendException(
                            reply,
                            request,
                            Exception.forbidden({
                                code: ErrorCode.CORS_ORIGIN_FORBIDDEN,
                                messageKey: `CORS origin is not allowed: ${originHeader}`,
                            }),
                        );
                    }
                } else if (isLocal || request.method === "GET" || request.method === "HEAD") {
                    done();
                } else {
                    this.sendException(
                        reply,
                        request,
                        Exception.forbidden({
                            code: ErrorCode.CORS_ORIGIN_REQUIRED,
                            messageKey: "CORS origin is required",
                        }),
                    );
                }
            });
    }

    /**
     * Registers fastify-cors.
     *
     * @note This method depends on prior filtering in {@link enforceAllowedOrigins}.
     * The permissive setup (callback(null, true)) is acceptable only because invalid requests are rejected at the onRequest stage.
     *
     * @param application Nest Fastify application instance. {@link NestFastifyApplication}
     */
    private static async configureCrossOriginResourceSharing(application: NestFastifyApplication): Promise<void> {
        await application.register(fastifyCors, {
            origin: (_origin, callback) => callback(null, true),
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            allowedHeaders: ["Authorization", "Content-Type"],
            credentials: true,
            maxAge: 86400,
        });
    }

    /**
     * Sets up CSP, HSTS, COEP, COOP, CORP, and nosniff headers.
     *
     * @param application Nest Fastify application instance. {@link NestFastifyApplication}
     *
     * @see CSP [Content Security Policy](https://developer.mozilla.org/docs/Web/HTTP/Guides/CSP)
     * @see HSTS [Strict Transport Security](https://developer.mozilla.org/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security)
     * @see CEOP [Cross-Origin Embedder Policy](https://developer.mozilla.org/docs/Web/HTTP/Headers/Cross-Origin-Embedder-Policy)
     * @see COOP [Cross-Origin Opener Policy](https://developer.mozilla.org/docs/Web/HTTP/Headers/Cross-Origin-Opener-Policy)
     * @see CORP [Cross-Origin Resource Policy](https://developer.mozilla.org/docs/Web/HTTP/Headers/Cross-Origin-Resource-Policy)
     * @see OWASP [Secure Headers Project](https://owasp.org/www-community/OWASP_Secure_Headers_Project#x-content-type-options)
     */
    private static async configureSecurityHeaders(application: NestFastifyApplication, hstsMaxAge: number): Promise<void> {
        const serviceOrigins: string[] = JSON.parse(process.env.ALLOWED_SERVICE_ORIGINS);
        const reference = serviceOrigins.map((url) => [`${url}/docs/openapi.json`, `${url}/docs`, `${url}/api/`]).flat();
        const isLocal = process.env.NODE_ENV === NodeEnv.LOCAL;

        await application.register(fastifyHelmet, {
            crossOriginEmbedderPolicy: true,
            crossOriginOpenerPolicy: { policy: "same-origin" },
            crossOriginResourcePolicy: { policy: "same-origin" },
            contentSecurityPolicy: {
                directives: {
                    scriptSrc: isLocal ? ["'self'", "'unsafe-inline'"] : ["'self'"],
                    styleSrc: isLocal ? ["'self'", "'unsafe-inline'"] : ["'self'"],
                    connectSrc: isLocal ? ["'self'", ...reference] : ["'self'"],
                    imgSrc: isLocal ? ["'self'", "data:"] : ["'self'"],
                    upgradeInsecureRequests: [],
                    defaultSrc: ["'self'"],
                },
            },
            hsts: {
                maxAge: hstsMaxAge,
                includeSubDomains: true,
                preload: true,
            },
            noSniff: true,
        });
    }

    /**
     * Removes the Server header.
     *
     * @note Reduces server software information disclosure.
     *
     * @param application Nest Fastify application instance. {@link NestFastifyApplication}
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
     * Blocks TRACE and TRACK HTTP methods.
     *
     * @note Prevents XST (Cross-Site Tracing) attacks.
     *
     * @param application Nest Fastify application instance. {@link NestFastifyApplication}
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
                    this.sendException(
                        reply,
                        request,
                        Exception.methodNotAllowed({
                            messageKey: `HTTP method is not allowed: ${method}`,
                        }),
                    );
                    return;
                }
                done();
            });
    }

    private static sendException(reply: FastifyReply, request: FastifyRequest, exception: Exception): void {
        const body: Exception.ResponseBody = {
            statusCode: exception.statusCode,
            timestamp: exception.timestamp,
            message: exception.messageKey,
            error: exception.kind,
            code: exception.code,
            path: request.url,
        };

        if (exception.headers) {
            reply.headers(exception.headers);
        }

        reply.code(exception.statusCode).type("application/json; charset=utf-8").send(body);
    }
}
