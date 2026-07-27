import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";

import { InviteAdapter } from "~context/infrastructure/adapters";
import { Invite } from "~context/domain/entities";
import { BaseRepository } from "~common/mixins";

@Injectable({ scope: Scope.DEFAULT })
export class InviteRepository
    extends BaseRepository<Entities.Invite, Adapters.Invite.Types>({
        Adapter: InviteAdapter,
        Entity: Invite,
    })
    implements Repositories.Invite.Contract
{
    public constructor(
        @InjectEntityManager("read")
        protected readonly readManager: ORM.EntityManager,
    ) {
        super();
    }
}
