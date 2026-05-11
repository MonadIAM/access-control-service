import { AccountDLQConsumer } from "./account-dlq.consumer";
import { ProjectionConsumer } from "./projection.consumer";
import { BlacklistConsumer } from "./blacklist.consumer";
import { AccountConsumer } from "./account.consumer";

export const CONSUMERS = [AccountDLQConsumer, ProjectionConsumer, BlacklistConsumer, AccountConsumer];

export { AccountDLQConsumer, ProjectionConsumer, BlacklistConsumer, AccountConsumer };
