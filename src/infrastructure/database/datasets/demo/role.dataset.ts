/* eslint-disable @typescript-eslint/explicit-function-return-type, prettier/prettier */
import { RoleActorType, RoleProtoType } from "~context/enums";

const SYSTEM_ACTOR = "00000000-0000-4000-8000-000000000000";
const DEMO_REALM   = "00000001-0000-4000-8000-200000000001";
const CREATED_AT   = new Date("2026-01-01T00:00:00.000Z");

const entry = (id: string, code: string, name: string, description: string, nonDelegable = false) => ({
    id,
    code,
    name,
    description,
    is_system_managed: false,
    non_delegable: nonDelegable,
    is_revoked: false,
    proto_type: RoleProtoType.COMPOSITE,
    actor_type: RoleActorType.HUMAN,
    realm_id: DEMO_REALM,
    created_at: CREATED_AT,
    version: 1,
    last_actions: { create: { by: { id: SYSTEM_ACTOR } } },
});

export const Roles = [
    entry(
        "00000002-0000-4000-8000-200000000001",
        "demo.root",
        "Root",
        "System root role for demo realm",
        true,
    ),
    entry(
        "00000002-0000-4000-8000-200000000002",
        "demo.user",
        "User",
        "Base user role for demo realm",
    ),
    entry(
        "00000002-0000-4000-8000-200000000003",
        "demo.administrator",
        "Administrator",
        "Administrator role for demo realm",
        true,
    ),
    entry(
        "00000002-0000-4000-8000-200000000004",
        "demo.be.junior",
        "BE Junior",
        "Junior backend developer",
    ),
    entry(
        "00000002-0000-4000-8000-200000000005",
        "demo.be.middle",
        "BE Middle",
        "Middle backend developer",
    ),
    entry(
        "00000002-0000-4000-8000-200000000006",
        "demo.be.senior",
        "BE Senior",
        "Senior backend developer",
    ),
    entry(
        "00000002-0000-4000-8000-200000000007",
        "demo.be.head",
        "BE Head",
        "Head of backend development",
    ),
    entry(
        "00000002-0000-4000-8000-200000000008",
        "demo.fe.junior",
        "FE Junior",
        "Junior frontend developer",
    ),
    entry(
        "00000002-0000-4000-8000-200000000009",
        "demo.fe.middle",
        "FE Middle",
        "Middle frontend developer",
    ),
    entry(
        "00000002-0000-4000-8000-200000000010",
        "demo.fe.senior",
        "FE Senior",
        "Senior frontend developer",
    ),
    entry(
        "00000002-0000-4000-8000-200000000011",
        "demo.qa.senior",
        "QA Senior",
        "Senior QA engineer",
    ),
    entry(
        "00000002-0000-4000-8000-200000000012",
        "demo.qa.head",
        "QA Head",
        "Head of QA",
    ),
    entry(
        "00000002-0000-4000-8000-200000000013",
        "demo.ba.middle",
        "BA Middle",
        "Middle business analyst",
    ),
    entry(
        "00000002-0000-4000-8000-200000000014",
        "demo.ba.senior",
        "BA Senior",
        "Senior business analyst",
    ),
    entry(
        "00000002-0000-4000-8000-200000000015",
        "demo.team-lead",
        "Team Lead",
        "Engineering team lead",
    ),
];
