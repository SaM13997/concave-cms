import type { Infer } from "convex/values";
import type { toastEventPayloadValidator, toastEventTypeValidator } from "./systemValidators";

export type ToastEventType = Infer<typeof toastEventTypeValidator>;
export type ToastEventPayload = Infer<typeof toastEventPayloadValidator>;

export function createToastPayload(
  type: ToastEventType,
  title: string,
  options?: { message?: string; durationMs?: number },
): ToastEventPayload {
  return {
    type,
    title,
    message: options?.message,
    durationMs: options?.durationMs,
  };
}

export function successToast(title: string, message?: string): ToastEventPayload {
  return createToastPayload("success", title, { message, durationMs: 4000 });
}

export function errorToast(title: string, message?: string): ToastEventPayload {
  return createToastPayload("error", title, { message, durationMs: 6000 });
}

export function infoToast(title: string, message?: string): ToastEventPayload {
  return createToastPayload("info", title, { message, durationMs: 4000 });
}
