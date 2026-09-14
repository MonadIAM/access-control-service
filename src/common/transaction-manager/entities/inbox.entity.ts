export class Inbox {
    public consumerKey: string;
    public event: string;

    public partition?: number;
    public offset?: string;
    public topic?: string;

    public processedAt: Date;

    public constructor(props: SystemEntities.Inbox.ConstructorProps) {
        this.consumerKey = props.consumerKey;
        this.event = props.event;

        this.partition = props.source?.partition;
        this.offset = props.source?.offset;
        this.topic = props.source?.topic;

        this.processedAt = new Date();
    }
}
