/* eslint-disable @typescript-eslint/explicit-function-return-type, prettier/prettier */
const SYSTEM_ACTOR = "00000000-0000-4000-8000-000000000000";
const DEMO_REALM   = "00000001-0000-4000-8000-200000000001";
const CREATED_AT   = new Date("2026-01-01T00:00:00.000Z");

const entry = (id: string, code: string, name: string, description: string) => ({
    id,
    code,
    name,
    description,
    realm_id: DEMO_REALM,
    is_system_managed: false,
    is_revoked: false,
    created_at: CREATED_AT,
    version: 1,
    last_actions: { create: { by: { id: SYSTEM_ACTOR } } },
});

export const Permissions = [
    entry(
        "00000003-0000-4000-8000-200000000001",
        "repo:pull",
        "Pull Repository",
        "Read access to source code repositories.",
    ),
    entry(
        "00000003-0000-4000-8000-200000000002",
        "repo:push",
        "Push Repository",
        "Write access to source code repositories.",
    ),
    entry(
        "00000003-0000-4000-8000-200000000003",
        "deploy:staging",
        "Deploy to Staging",
        "Trigger deployments to the staging environment.",
    ),
    entry(
        "00000003-0000-4000-8000-200000000004",
        "deploy:production",
        "Deploy to Production",
        "Trigger deployments to the production environment.",
    ),
    entry(
        "00000003-0000-4000-8000-200000000005",
        "ui:view",
        "View UI Components",
        "Read access to UI component library and design assets.",
    ),
    entry(
        "00000003-0000-4000-8000-200000000006",
        "ui:edit",
        "Edit UI Components",
        "Write access to UI component library and design assets.",
    ),
    entry(
        "00000003-0000-4000-8000-200000000007",
        "release:publish",
        "Publish Release",
        "Publish frontend releases and changelogs.",
    ),
    entry(
        "00000003-0000-4000-8000-200000000008",
        "test:run",
        "Run Tests",
        "Execute test suites and view results.",
    ),
    entry(
        "00000003-0000-4000-8000-200000000009",
        "test:manage",
        "Manage Tests",
        "Create, modify and delete test suites and test plans.",
    ),
    entry(
        "00000003-0000-4000-8000-200000000010",
        "spec:read",
        "Read Specifications",
        "Read access to business requirements and technical specifications.",
    ),
    entry(
        "00000003-0000-4000-8000-200000000011",
        "spec:write",
        "Write Specifications",
        "Create and modify business requirements and technical specifications.",
    ),
    entry(
        "00000003-0000-4000-8000-200000000012",
        "team:manage",
        "Manage Team",
        "Manage team members, assignments and performance reviews.",
    ),
    entry(
        "00000003-0000-4000-8000-200000000013",
        "roadmap:edit",
        "Edit Roadmap",
        "Create and modify project roadmap and milestone planning.",
    ),
];
