import { ReauthenticationConsumer } from "./reauthentication.consumer";
import { ProjectionConsumer } from "./projection.consumer";
import { BlacklistConsumer } from "./blacklist.consumer";
import { AccountConsumer } from "./account.consumer";
import { RetryConsumer } from "./retry.consumer";

export const CONSUMERS = [ReauthenticationConsumer, RetryConsumer, ProjectionConsumer, BlacklistConsumer, AccountConsumer];

export { ReauthenticationConsumer, RetryConsumer, ProjectionConsumer, BlacklistConsumer, AccountConsumer };
