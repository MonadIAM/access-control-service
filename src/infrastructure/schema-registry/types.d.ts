declare namespace SchemaRegistry {
    type Versions = {
        versions?: { version?: string }[];
    };

    type Config = {
        registryUrl: string;
        serviceName: string;
        enabled: boolean;
        scope: Scope;
        mode: Mode;
    };

    interface Contract extends PublicContract, InternalContract {}

    interface PublicContract {
        run: Run.Signature;
    }

    namespace Run {
        type Result = Promise<void>;

        type Signature = () => Result;
    }

    interface InternalContract {
        load: Load.Signature;
        save: Save.Signature;
        sync: Sync.Signature;
    }

    namespace Sync {
        type Props = {
            artifact: Artifact;
            config: Config;
        };

        type Result = Promise<void>;

        type Signature = (props: Props) => Result;
    }

    namespace Load {
        type Props = {
            artifact: Artifact;
            config: Config;
        };

        type Result = Promise<string | null>;

        type Signature = (props: Props) => Result;
    }

    namespace Save {
        type Props = {
            artifact: Artifact;
            config: Config;
            content: string;
            exists: boolean;
        };

        type Result = Promise<void>;

        type Signature = (props: Props) => Result;
    }
}
