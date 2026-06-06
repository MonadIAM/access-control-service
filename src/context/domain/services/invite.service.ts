import { Injectable, Scope } from "@nestjs/common";

import { Exception } from "~common/exceptions";
import { Invite } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class InviteService implements Services.Invite.Contract {
    private readonly dictionaryPath = "services.invite";

    public create(props: Services.Invite.Create.Props): Services.Invite.Create.Result {
        const { transaction, input, realm, role } = props;
        if (role.realm.id === realm.id) {
            const entity = new Invite({ ...input, realm, role });
            transaction.persist(entity);
            return entity;
        } else {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.ROLE_NOT_IN_REALM` });
        }
    }

    public accept(props: Services.Invite.Accept.Props): Services.Invite.Accept.Result {
        props.entity.accept();
    }

    public decline(props: Services.Invite.Decline.Props): Services.Invite.Decline.Result {
        props.entity.decline();
    }

    public cancel(props: Services.Invite.Cancel.Props): Services.Invite.Cancel.Result {
        props.entity.cancel();
    }
}
