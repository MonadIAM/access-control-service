declare namespace DeltaAudit {
    type Actor = {
        id: string;
    };

    type FieldPatch<T, K extends keyof T> = {
        old: Optional<T[K]>;
        new: T[K];
    };

    type Patch<T> = {
        [K in keyof T]?: FieldPatch<T, K>;
    };

    type BaseAction = {
        by: Actor;
        at: Date;
        reason: string;
    };

    type UpdateAction<T> = BaseAction & {
        patch: Patch<T>;
    };

    type CreateAction = Omit<BaseAction, "at" | "reason">;

    type BaseSnapshot = {
        create: CreateAction;
        restore?: BaseAction;
        revoke?: BaseAction;
    };

    type LastActionsSnapshot<T = never> = [T] extends [never]
        ? BaseSnapshot
        : BaseSnapshot & {
              update?: UpdateAction<T>;
          };
}
