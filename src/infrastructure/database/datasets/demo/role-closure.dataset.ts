/* eslint-disable prettier/prettier */
const DEMO_REALM = "00000001-0000-4000-8000-000000000002";

const DEMO_ROOT   = "00000002-0000-4000-8000-000000000005";
const DEMO_USER   = "00000002-0000-4000-8000-000000000006";
const DEMO_ADMIN  = "00000002-0000-4000-8000-000000000007";
const BE_JUNIOR   = "00000002-0000-4000-8000-000000000008";
const BE_MIDDLE   = "00000002-0000-4000-8000-000000000009";
const BE_SENIOR   = "00000002-0000-4000-8000-000000000010";
const BE_HEAD     = "00000002-0000-4000-8000-000000000011";
const FE_JUNIOR   = "00000002-0000-4000-8000-000000000012";
const FE_MIDDLE   = "00000002-0000-4000-8000-000000000013";
const FE_SENIOR   = "00000002-0000-4000-8000-000000000014";
const QA_SENIOR   = "00000002-0000-4000-8000-000000000015";
const QA_HEAD     = "00000002-0000-4000-8000-000000000016";
const BA_MIDDLE   = "00000002-0000-4000-8000-000000000017";
const BA_SENIOR   = "00000002-0000-4000-8000-000000000018";
const TEAM_LEAD   = "00000002-0000-4000-8000-000000000019";

export const RoleClosures = [
    { realm_id: DEMO_REALM, ancestor_id: DEMO_ROOT,  descendant_id: DEMO_ROOT,  depth: 0 },

    { realm_id: DEMO_REALM, ancestor_id: DEMO_USER,  descendant_id: DEMO_USER,  depth: 0 },
    { realm_id: DEMO_REALM, ancestor_id: DEMO_ROOT,  descendant_id: DEMO_USER,  depth: 1 },

    { realm_id: DEMO_REALM, ancestor_id: DEMO_ADMIN, descendant_id: DEMO_ADMIN, depth: 0 },
    { realm_id: DEMO_REALM, ancestor_id: DEMO_ROOT,  descendant_id: DEMO_ADMIN, depth: 1 },

    { realm_id: DEMO_REALM, ancestor_id: BE_JUNIOR,  descendant_id: BE_JUNIOR,  depth: 0 },
    { realm_id: DEMO_REALM, ancestor_id: DEMO_USER,  descendant_id: BE_JUNIOR,  depth: 1 },
    { realm_id: DEMO_REALM, ancestor_id: DEMO_ROOT,  descendant_id: BE_JUNIOR,  depth: 2 },

    { realm_id: DEMO_REALM, ancestor_id: BE_MIDDLE,  descendant_id: BE_MIDDLE,  depth: 0 },
    { realm_id: DEMO_REALM, ancestor_id: BE_JUNIOR,  descendant_id: BE_MIDDLE,  depth: 1 },
    { realm_id: DEMO_REALM, ancestor_id: DEMO_USER,  descendant_id: BE_MIDDLE,  depth: 2 },
    { realm_id: DEMO_REALM, ancestor_id: DEMO_ROOT,  descendant_id: BE_MIDDLE,  depth: 3 },

    { realm_id: DEMO_REALM, ancestor_id: BE_SENIOR,  descendant_id: BE_SENIOR,  depth: 0 },
    { realm_id: DEMO_REALM, ancestor_id: BE_MIDDLE,  descendant_id: BE_SENIOR,  depth: 1 },
    { realm_id: DEMO_REALM, ancestor_id: BE_JUNIOR,  descendant_id: BE_SENIOR,  depth: 2 },
    { realm_id: DEMO_REALM, ancestor_id: DEMO_USER,  descendant_id: BE_SENIOR,  depth: 3 },
    { realm_id: DEMO_REALM, ancestor_id: DEMO_ROOT,  descendant_id: BE_SENIOR,  depth: 4 },

    { realm_id: DEMO_REALM, ancestor_id: BE_HEAD,    descendant_id: BE_HEAD,    depth: 0 },
    { realm_id: DEMO_REALM, ancestor_id: BE_SENIOR,  descendant_id: BE_HEAD,    depth: 1 },
    { realm_id: DEMO_REALM, ancestor_id: BE_MIDDLE,  descendant_id: BE_HEAD,    depth: 2 },
    { realm_id: DEMO_REALM, ancestor_id: BE_JUNIOR,  descendant_id: BE_HEAD,    depth: 3 },
    { realm_id: DEMO_REALM, ancestor_id: DEMO_USER,  descendant_id: BE_HEAD,    depth: 4 },
    { realm_id: DEMO_REALM, ancestor_id: DEMO_ROOT,  descendant_id: BE_HEAD,    depth: 5 },

    { realm_id: DEMO_REALM, ancestor_id: FE_JUNIOR,  descendant_id: FE_JUNIOR,  depth: 0 },
    { realm_id: DEMO_REALM, ancestor_id: DEMO_USER,  descendant_id: FE_JUNIOR,  depth: 1 },
    { realm_id: DEMO_REALM, ancestor_id: DEMO_ROOT,  descendant_id: FE_JUNIOR,  depth: 2 },

    { realm_id: DEMO_REALM, ancestor_id: FE_MIDDLE,  descendant_id: FE_MIDDLE,  depth: 0 },
    { realm_id: DEMO_REALM, ancestor_id: FE_JUNIOR,  descendant_id: FE_MIDDLE,  depth: 1 },
    { realm_id: DEMO_REALM, ancestor_id: DEMO_USER,  descendant_id: FE_MIDDLE,  depth: 2 },
    { realm_id: DEMO_REALM, ancestor_id: DEMO_ROOT,  descendant_id: FE_MIDDLE,  depth: 3 },

    { realm_id: DEMO_REALM, ancestor_id: FE_SENIOR,  descendant_id: FE_SENIOR,  depth: 0 },
    { realm_id: DEMO_REALM, ancestor_id: FE_MIDDLE,  descendant_id: FE_SENIOR,  depth: 1 },
    { realm_id: DEMO_REALM, ancestor_id: FE_JUNIOR,  descendant_id: FE_SENIOR,  depth: 2 },
    { realm_id: DEMO_REALM, ancestor_id: DEMO_USER,  descendant_id: FE_SENIOR,  depth: 3 },
    { realm_id: DEMO_REALM, ancestor_id: DEMO_ROOT,  descendant_id: FE_SENIOR,  depth: 4 },

    { realm_id: DEMO_REALM, ancestor_id: QA_SENIOR,  descendant_id: QA_SENIOR,  depth: 0 },
    { realm_id: DEMO_REALM, ancestor_id: DEMO_USER,  descendant_id: QA_SENIOR,  depth: 1 },
    { realm_id: DEMO_REALM, ancestor_id: DEMO_ROOT,  descendant_id: QA_SENIOR,  depth: 2 },

    { realm_id: DEMO_REALM, ancestor_id: QA_HEAD,    descendant_id: QA_HEAD,    depth: 0 },
    { realm_id: DEMO_REALM, ancestor_id: QA_SENIOR,  descendant_id: QA_HEAD,    depth: 1 },
    { realm_id: DEMO_REALM, ancestor_id: DEMO_USER,  descendant_id: QA_HEAD,    depth: 2 },
    { realm_id: DEMO_REALM, ancestor_id: DEMO_ROOT,  descendant_id: QA_HEAD,    depth: 3 },

    { realm_id: DEMO_REALM, ancestor_id: BA_MIDDLE,  descendant_id: BA_MIDDLE,  depth: 0 },
    { realm_id: DEMO_REALM, ancestor_id: DEMO_USER,  descendant_id: BA_MIDDLE,  depth: 1 },
    { realm_id: DEMO_REALM, ancestor_id: DEMO_ROOT,  descendant_id: BA_MIDDLE,  depth: 2 },

    { realm_id: DEMO_REALM, ancestor_id: BA_SENIOR,  descendant_id: BA_SENIOR,  depth: 0 },
    { realm_id: DEMO_REALM, ancestor_id: BA_MIDDLE,  descendant_id: BA_SENIOR,  depth: 1 },
    { realm_id: DEMO_REALM, ancestor_id: DEMO_USER,  descendant_id: BA_SENIOR,  depth: 2 },
    { realm_id: DEMO_REALM, ancestor_id: DEMO_ROOT,  descendant_id: BA_SENIOR,  depth: 3 },

    { realm_id: DEMO_REALM, ancestor_id: TEAM_LEAD,  descendant_id: TEAM_LEAD,  depth: 0 },
    { realm_id: DEMO_REALM, ancestor_id: DEMO_USER,  descendant_id: TEAM_LEAD,  depth: 1 },
    { realm_id: DEMO_REALM, ancestor_id: DEMO_ROOT,  descendant_id: TEAM_LEAD,  depth: 2 },
];
