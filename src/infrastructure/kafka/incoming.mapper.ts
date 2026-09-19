import { Exception } from "~common/exceptions";

export class KafkaIncomingMapper implements Kafka.IncomingMapper.Contract {
    private readonly dictionaryPath = "services.kafka-incoming";

    public map(props: Kafka.IncomingMapper.Map.Props): Kafka.IncomingMapper.Map.Result {
        const { context, consumerKey } = props;
        const event = this.event({ context });

        return {
            source: {
                offset: context.getMessage().offset,
                partition: context.getPartition(),
                topic: context.getTopic(),
            },
            consumerKey,
            event,
        };
    }

    public reference(props: Kafka.IncomingMapper.Event.Props): Kafka.IncomingMapper.Event.Result {
        const { context } = props;
        const event = context.getMessage().key?.toString();
        return event?.length ? event : `${context.getTopic()}:${context.getPartition()}:${context.getMessage().offset}`;
    }

    public event(props: Kafka.IncomingMapper.Event.Props): Kafka.IncomingMapper.Event.Result {
        const event = props.context.getMessage().key?.toString();

        if (event) {
            return event;
        } else {
            throw Exception.unprocessable({ messageKey: `${this.dictionaryPath}.EVENT_MISSING` });
        }
    }
}
