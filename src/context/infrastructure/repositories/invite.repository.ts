import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";

import { Invite } from "~context/domain/entities";
import { BaseRepository } from "~common/mixins";

import { InviteMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class InviteRepository
    extends BaseRepository<Entities.Invite, Repositories.Mappers.Invite.Types>({
        Mapper: InviteMapper,
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
