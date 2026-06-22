import { v } from "convex/values";

export const authUserValidator = v.object({
  _id: v.string(),
  name: v.string(),
  email: v.string(),
  emailVerified: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
  image: v.optional(v.union(v.string(), v.null())),
});

export type AuthUser = {
  _id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: number;
  updatedAt: number;
  image?: string | null;
};
