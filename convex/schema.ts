import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { roleValidator } from "./lib/permissions";

export default defineSchema({
  cmsUsers: defineTable({
    authUserId: v.string(),
    email: v.string(),
    name: v.string(),
    role: roleValidator,
  }).index("by_auth_user_id", ["authUserId"]),
});
