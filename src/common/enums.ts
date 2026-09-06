export enum NodeEnv {
    LOCAL = "local",
    STAND = "stand",
}

export enum OTelTracesSampler {
    PARENTBASED_TRACEIDRATIO = "parentbased_traceidratio",
    PARENTBASED_ALWAYS_OFF = "parentbased_always_off",
    PARENTBASED_ALWAYS_ON = "parentbased_always_on",
    TRACEIDRATIO = "traceidratio",
    ALWAYS_OFF = "always_off",
    ALWAYS_ON = "always_on",
}

export enum OTelLogsExporter {
    CONSOLE = "console",
    OTLP = "otlp",
    NONE = "none",
}
