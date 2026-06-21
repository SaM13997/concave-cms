import { v } from "convex/values";
import { editorMutation, editorQuery } from "./lib/rbac";
import { debugCounterItemValidator } from "./lib/systemValidators";

export const REACTIVE_COUNTER_LABEL = "e2e-live-counter";

export const getReactiveCounter = editorQuery({
  args: { label: v.optional(v.string()) },
  returns: v.union(debugCounterItemValidator, v.null()),
  handler: async (ctx, args) => {
    const label = args.label ?? REACTIVE_COUNTER_LABEL;
    const counter = await ctx.db
      .query("debugCounters")
      .withIndex("by_label", (q) => q.eq("label", label))
      .unique();

    if (!counter) {
      return null;
    }

    return {
      _id: counter._id,
      _creationTime: counter._creationTime,
      label: counter.label,
      value: counter.value,
      updatedAt: counter.updatedAt,
    };
  },
});

export const incrementReactiveCounter = editorMutation({
  args: { label: v.optional(v.string()) },
  returns: debugCounterItemValidator,
  handler: async (ctx, args) => {
    const label = args.label ?? REACTIVE_COUNTER_LABEL;
    const now = Date.now();

    const existing = await ctx.db
      .query("debugCounters")
      .withIndex("by_label", (q) => q.eq("label", label))
      .unique();

    if (existing) {
      const value = existing.value + 1;
      await ctx.db.patch(existing._id, { value, updatedAt: now });
      return {
        _id: existing._id,
        _creationTime: existing._creationTime,
        label: existing.label,
        value,
        updatedAt: now,
      };
    }

    const counterId = await ctx.db.insert("debugCounters", {
      label,
      value: 1,
      updatedAt: now,
    });

    const counter = await ctx.db.get(counterId);
    if (!counter) {
      throw new Error("Failed to create counter");
    }

    return {
      _id: counter._id,
      _creationTime: counter._creationTime,
      label: counter.label,
      value: counter.value,
      updatedAt: counter.updatedAt,
    };
  },
});
