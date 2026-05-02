import { AccountDLQConsumer } from "./account-dlq.consumer";
import { BlacklistConsumer } from "./blacklist.consumer";
import { AccountConsumer } from "./account.consumer";

export const CONSUMERS = [AccountDLQConsumer, BlacklistConsumer, AccountConsumer];

export { AccountDLQConsumer, BlacklistConsumer, AccountConsumer };
