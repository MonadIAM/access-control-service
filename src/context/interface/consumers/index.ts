import { ProjectionConsumer } from "./projection.consumer";
import { BlacklistConsumer } from "./blacklist.consumer";
import { AccountConsumer } from "./account.consumer";
import { RetryConsumer } from "./retry.consumer";

export const CONSUMERS = [RetryConsumer, ProjectionConsumer, BlacklistConsumer, AccountConsumer];

export { RetryConsumer, ProjectionConsumer, BlacklistConsumer, AccountConsumer };
