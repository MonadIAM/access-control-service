import { ElevatedAccessConsumer } from "./elevated-access.consumer";
import { ProjectionConsumer } from "./projection.consumer";
import { BlacklistConsumer } from "./blacklist.consumer";
import { AccountConsumer } from "./account.consumer";
import { RetryConsumer } from "./retry.consumer";

export const CONSUMERS = [ElevatedAccessConsumer, RetryConsumer, ProjectionConsumer, BlacklistConsumer, AccountConsumer];

export { ElevatedAccessConsumer, RetryConsumer, ProjectionConsumer, BlacklistConsumer, AccountConsumer };
