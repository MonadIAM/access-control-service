import { ReauthenticationConsumer } from "./reauthentication.consumer";
import { ProjectionConsumer } from "./projection.consumer";
import { BlacklistConsumer } from "./blacklist.consumer";
import { AccountConsumer } from "./account.consumer";
import { RealmConsumer } from "./realm.consumer";

export const CONSUMERS = [RealmConsumer, ReauthenticationConsumer, ProjectionConsumer, BlacklistConsumer, AccountConsumer];

export { RealmConsumer, ReauthenticationConsumer, ProjectionConsumer, BlacklistConsumer, AccountConsumer };
