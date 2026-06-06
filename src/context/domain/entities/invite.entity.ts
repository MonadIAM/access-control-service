import { randomUUID } from "node:crypto";

import { Exception } from "~common/exceptions";
import { InviteStatus } from "~context/enums";

import { Realm } from "./realm.entity";
import { Role } from "./role.entity";

export class Invite {
    private get dictionaryPath(): string {
        return "entities.invite";
    }

    public id: string;
    public createdAt: Date;
    public updatedAt?: Date;
    public version: number = 1;

    public status: InviteStatus;
    public invitee: string;
    public inviter: string;

    public realm: Realm;
    public role: Role;

    public constructor(props: Entities.Invite.ConstructorProps) {
        this.createdAt = new Date();
        this.id = randomUUID();

        this.status = InviteStatus.PENDING;
        this.invitee = props.invitee;
        this.inviter = props.inviter;

        this.realm = props.realm;
        this.role = props.role;
    }

    public cancel(): void {
        if (this.status === InviteStatus.PENDING) {
            this.status = InviteStatus.CANCELLED;
            this.updatedAt = new Date();
        } else {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.CANNOT_CANCEL_INACTIVE` });
        }
    }

    public accept(): void {
        if (this.status === InviteStatus.PENDING) {
            this.status = InviteStatus.ACCEPTED;
            this.updatedAt = new Date();
        } else {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.CANNOT_ACCEPT_INACTIVE` });
        }
    }

    public decline(): void {
        if (this.status === InviteStatus.PENDING) {
            this.status = InviteStatus.DECLINED;
            this.updatedAt = new Date();
        } else {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.CANNOT_DECLINE_INACTIVE` });
        }
    }
}
