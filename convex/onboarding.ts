import { v } from "convex/values";
import { getActiveSchemaBySlug } from "./lib/contentSchemas";
import { authedMutationWithRole, authedQueryWithRole } from "./lib/rbac";

const onboardingStepValidator = v.union(
  v.literal("welcome"),
  v.literal("schema"),
  v.literal("content"),
  v.literal("publish"),
  v.literal("complete"),
);

const onboardingStatusValidator = v.object({
  showWizard: v.boolean(),
  step: onboardingStepValidator,
  blogSchemaActive: v.boolean(),
  hasBlogEntry: v.boolean(),
  hasPublishedPost: v.boolean(),
});

export const getStatus = authedQueryWithRole({
  args: {},
  returns: onboardingStatusValidator,
  handler: async (ctx) => {
    const { cmsUser, role } = ctx;

    const blogSchema = await getActiveSchemaBySlug(ctx, "blog");
    const blogSchemaActive = blogSchema !== null;

    const blogEntries = blogSchemaActive
      ? await ctx.db
          .query("contentEntries")
          .withIndex("by_content_type", (q) => q.eq("contentType", "blog"))
          .take(20)
      : [];

    const hasPublishedPost = blogEntries.some((entry) => entry.status === "published");
    const hasBlogEntry = blogEntries.length > 0;

    if (hasPublishedPost && !cmsUser.onboardingCompletedAt) {
      return {
        showWizard: true,
        step: "complete" as const,
        blogSchemaActive,
        hasBlogEntry,
        hasPublishedPost,
      };
    }

    if (cmsUser.onboardingCompletedAt || cmsUser.onboardingDismissedAt || role !== "admin") {
      return {
        showWizard: false,
        step: "complete" as const,
        blogSchemaActive,
        hasBlogEntry,
        hasPublishedPost,
      };
    }

    let step: "welcome" | "schema" | "content" | "publish" = "welcome";
    if (!blogSchemaActive) {
      step = "schema";
    } else if (!hasBlogEntry) {
      step = "content";
    } else {
      step = "publish";
    }

    return {
      showWizard: true,
      step,
      blogSchemaActive,
      hasBlogEntry,
      hasPublishedPost,
    };
  },
});

export const completeOnboarding = authedMutationWithRole({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await ctx.db.patch(ctx.cmsUser._id, {
      onboardingCompletedAt: Date.now(),
    });
    return null;
  },
});

export const dismissOnboarding = authedMutationWithRole({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await ctx.db.patch(ctx.cmsUser._id, {
      onboardingDismissedAt: Date.now(),
    });
    return null;
  },
});
