import { randomUUID } from "node:crypto";

import { ProjectionJournalStatus } from "~context/enums";

export class ProjectionJournal {
    public id: string;
    public createdAt: Date;

    public operationType: string;
    public payload: UnknownObject;

    public status: ProjectionJournalStatus;
    public attempts: number;
    public lastError?: string;

    public availableAt: Date;
    public lockedAt?: Date;
    public lockedBy?: string;

    public appliedAt?: Date;

    public constructor(props: Entities.ProjectionJournal.ConstructorProps) {
        this.id = randomUUID();
        this.createdAt = new Date();

        this.operationType = props.operationType;
        this.payload = props.payload;

        this.availableAt = props.availableAt ?? new Date();
        this.status = ProjectionJournalStatus.PENDING;
        this.attempts = 0;
    }
}
