declare namespace Extract {
    type Meta = {
        userAgent: string;
        ip: string;
    };

    namespace Session {
        type Public = {
            account?: string;
            session?: string;
        };
        type Auth = {
            account: string;
            session: string;
        };
    }
}
