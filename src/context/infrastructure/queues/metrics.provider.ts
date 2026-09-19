import { makeGaugeProvider } from "@willsoto/nestjs-prometheus";
import { getQueueToken } from "@nestjs/bullmq";
import { Gauge } from "prom-client";
import { Queue } from "bullmq";

import { BullQueue } from "./enums";

const BULLMQ_JOB_STATES: Queues.Metrics.JobState[] = [
    "waiting",
    "active",
    "delayed",
    "prioritized",
    "waiting-children",
    "failed",
    "completed",
];

export const BULLMQ_JOBS_PROVIDER = makeGaugeProvider({
    name: "bullmq_jobs",
    help: "Current number of BullMQ jobs by queue and state",
    labelNames: ["queue", "state"],
    inject: [getQueueToken(BullQueue.CLEANUP)],
    collect: async function (this: Gauge<string>, cleanup: Queue): Promise<void> {
        const queues = [{ name: BullQueue.CLEANUP, instance: cleanup }];

        const snapshots = await Promise.all(
            queues.map(async (queue) => ({
                counts: (await queue.instance.getJobCounts(...BULLMQ_JOB_STATES)) as Queues.Metrics.JobCounts,
                name: queue.name,
            })),
        );

        for (const snapshot of snapshots) {
            for (const state of BULLMQ_JOB_STATES) {
                this.set({ queue: snapshot.name, state }, snapshot.counts[state] ?? 0);
            }
        }
    },
});
