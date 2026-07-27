import { Inject, Injectable, Scope } from "@nestjs/common";

import { INVITE_REPOSITORY } from "~context/domain/repositories";
import { InviteQueryScope, QueryMode } from "~context/enums";

@Injectable({ scope: Scope.DEFAULT })
export class InviteQueries implements Queries.Invite.Contract {
    private readonly populate = {
        DETAILED: ["realm", "role"] as const,
        COMPACT: [] as const,
    };

    public constructor(
        @Inject(INVITE_REPOSITORY)
        private readonly inviteRepository: Repositories.Invite.QueryContract,
    ) {}

    public findUnique(props: Queries.Invite.FindUnique.Props): Queries.Invite.FindUnique.Result {
        const filter: ORM.ObjectQuery<Entities.Invite> = {};

        if (props.mode === QueryMode.DEFAULT) {
            filter.$or = [{ invitee: props.actor }, { inviter: props.actor }];
        }

        return this.inviteRepository.findUniqueOrThrow({
            where: { id: props.invite, realm: props.realm, ...filter },
            options: { populate: this.populate[props.view] },
        });
    }

    public findMany(props: Queries.Invite.FindMany.Props): Queries.Invite.FindMany.Result {
        const prefilter: ORM.ObjectQuery<Entities.Invite> = {};

        if (props.mode === QueryMode.DEFAULT) {
            if (props.scope === InviteQueryScope.AS_INVITER) {
                prefilter.inviter = props.actor;
            } else if (props.scope === InviteQueryScope.AS_INVITEE) {
                prefilter.invitee = props.actor;
            }
            prefilter.realm = props.realm;
        }

        return this.inviteRepository.findMany({
            options: { populate: this.populate[props.view] },
            pagination: props.pagination,
            filters: props.filters,
            sort: props.sort,
            prefilter,
        });
    }
}
