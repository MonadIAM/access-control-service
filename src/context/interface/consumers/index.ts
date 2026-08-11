import { ReauthenticationConsumer } from "./reauthentication.consumer";
import { MembershipConsumer } from "./membership.consumer";
import { ProjectionConsumer } from "./projection.consumer";
import { BlacklistConsumer } from "./blacklist.consumer";
import { AccountConsumer } from "./account.consumer";
import { RetryConsumer } from "./retry.consumer";

export const CONSUMERS = [
    ReauthenticationConsumer,
    MembershipConsumer,
    ProjectionConsumer,
    BlacklistConsumer,
    AccountConsumer,
    RetryConsumer,
];

export {
    ReauthenticationConsumer,
    MembershipConsumer,
    ProjectionConsumer,
    BlacklistConsumer,
    AccountConsumer,
    RetryConsumer,
};
