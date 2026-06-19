import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "cleanup expired sessions and tokens",
  { minutes: 5 },
  internal.internal.maintenance.cleanupExpiredSessions,
  {},
);

export default crons;
