import { AccessCacheTopicAction, MembershipTopicAction } from "@monadiam/contracts";
import { Inject, Injectable, Scope } from "@nestjs/common";

import { INVITE_REPOSITORY, REALM_REPOSITORY, ROLE_REPOSITORY } from "~context/infrastructure/repositories/tokens";
import { EntityType, ActionType, InvalidationScope, InviteStatus, KafkaTopic } from "~context/enums";
import { ACCOUNT_ROLE_ASSIGNMENT_SERVICE, INVITE_SERVICE } from "~context/domain/services/tokens";
import { PROJECTION_CACHE_SERVICE } from "~context/infrastructure/services/tokens";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { ProjectionScript } from "~context/infrastructure/scripts";
import { Exception } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class InviteCommands implements Commands.Invite.Contract {
    private readonly dictionaryPath = "commands.invite";
    private readonly resource = "Invite";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.Contract,
        @Inject(INVITE_REPOSITORY)
        private readonly inviteRepository: Repositories.Invite.Contract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.Contract,
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: Repositories.Role.Contract,
        @Inject(INVITE_SERVICE)
        private readonly inviteService: Services.Invite.Contract,
        @Inject(ACCOUNT_ROLE_ASSIGNMENT_SERVICE)
        private readonly accountRoleAssignmentService: Services.AccountRoleAssignment.Contract,
        @Inject(PROJECTION_CACHE_SERVICE)
        private readonly projectionCacheService: InfrastructureServices.ProjectionCache.Contract,
    ) {}

    public async create(props: Commands.Invite.Create.Props): Commands.Invite.Create.Result {
        const { input, actor, realm } = props;

        const isAlreadyMember = await this.projectionCacheService.checkRealm({
            account: input.invitee,
            realm,
        });

        if (isAlreadyMember) {
            throw Exception.conflict({ messageKey: `${this.dictionaryPath}.INVITEE_ALREADY_MEMBER` });
        }

        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.INVITE,
                actionType: ActionType.CREATE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const [realmEntity, roleEntity] = await Promise.all([
                    this.realmRepository.findUniqueOrThrow({
                        where: { id: realm },
                        transaction,
                    }),
                    this.roleRepository.findUniqueOrThrow({
                        where: { id: input.role },
                        options: { populate: ["realm"] },
                        transaction,
                    }),
                ]);

                const entity = this.inviteService.create({
                    input: { invitee: input.invitee, inviter: actor },
                    realm: realmEntity,
                    role: roleEntity,
                    transaction,
                });

                return [entity];
            },
        });

        return { message: `${this.dictionaryPath}.CREATED` };
    }

    public changeStatus(props: Commands.Invite.ChangeStatus.Props): Commands.Invite.ChangeStatus.Result {
        switch (props.input.status) {
            case InviteStatus.ACCEPTED:
                return this.accept(props);
            case InviteStatus.DECLINED:
                return this.decline(props);
            default:
                return this.cancel(props);
        }
    }

    public async accept(props: Commands.Invite.Accept.Props): Commands.Invite.Accept.Result {
        const { input, actor, realm } = props;

        await this.transactionalService.run<Commands.Invite.Accept.ExecuteResult>({
            resource: this.resource,
            projectionJournal: {
                operationType: ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_CREATE,
                payloadMapper: ({ assignments }) => ({
                    assignments: assignments.map(({ id, role }) => ({
                        assignment: id,
                        role: role.id,
                    })),
                    account: assignments[0].account,
                    realm: assignments[0].realm.id,
                }),
            },
            outbox: [
                {
                    actionType: AccessCacheTopicAction.INVALIDATE,
                    destinationTopic: KafkaTopic.ACCESS_CACHE,
                    payloadMapper: ({ assignments }) => ({
                        items: assignments.map(({ account, realm }) => ({
                            scope: InvalidationScope.ACCOUNT_REALM,
                            realm: realm.id,
                            account,
                        })),
                    }),
                },
                {
                    actionType: MembershipTopicAction.GRANT,
                    destinationTopic: KafkaTopic.MEMBERSHIP,
                    payloadMapper: ({ invitedBy }) => ({
                        joinedAt: Date.now(),
                        account: actor,
                        invitedBy,
                        realm,
                    }),
                },
            ],
            audit: {
                actionType: ActionType.ACCEPT,
                entityType: EntityType.INVITE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entity = await this.inviteRepository.findUniqueOrThrow({
                    where: { id: input.invite, realm, invitee: actor },
                    options: { populate: ["role", "realm"] },
                    transaction,
                });

                this.inviteService.accept({ entity });

                const assignments = await this.accountRoleAssignmentService.create({
                    input: { account: actor, roles: [entity.role] },
                    actor: entity.inviter,
                    realm: entity.realm,
                    transaction,
                });

                return { assignments, invitedBy: entity.inviter };
            },
        });

        return { message: `${this.dictionaryPath}.ACCEPTED` };
    }

    public async cancel(props: Commands.Invite.Cancel.Props): Commands.Invite.Cancel.Result {
        const { input, actor, realm } = props;

        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.INVITE,
                actionType: ActionType.CANCEL,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entity = await this.inviteRepository.findUniqueOrThrow({
                    where: { id: input.invite, realm, inviter: actor },
                    transaction,
                });

                this.inviteService.cancel({ entity });

                return [entity];
            },
        });

        return { message: `${this.dictionaryPath}.CANCELLED` };
    }

    public async decline(props: Commands.Invite.Decline.Props): Commands.Invite.Decline.Result {
        const { input, actor, realm } = props;

        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                actionType: ActionType.DECLINE,
                entityType: EntityType.INVITE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entity = await this.inviteRepository.findUniqueOrThrow({
                    where: { id: input.invite, realm, invitee: actor },
                    transaction,
                });

                this.inviteService.decline({ entity });

                return [entity];
            },
        });

        return { message: `${this.dictionaryPath}.DECLINED` };
    }
}
