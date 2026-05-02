import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { getErrorMessage } from "@/lib/utils";

type SignInStep = "email" | "otp";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<SignInStep>("email");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sendCode = async (email: string) => {
    const result = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "sign-in",
    });

    if (result.error) {
      return { ok: false as const, error: getErrorMessage(result.error, "Could not send code") };
    }

    return { ok: true as const };
  };

  const verifyCode = async (email: string, otp: string) => {
    const result = await authClient.signIn.emailOtp({ email, otp });

    if (result.error) {
      return {
        ok: false as const,
        error: getErrorMessage(result.error, "Invalid or expired code"),
      };
    }

    return { ok: true as const };
  };

  const submitEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await sendCode(email);

    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setStep("otp");
  };

  const submitOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await verifyCode(email, otp);

    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error);
    }
  };

  const resendCode = async () => {
    setError(null);
    setIsSubmitting(true);

    const result = await sendCode(email);

    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error);
    }
  };

  return step === "email" ? (
    <form className="flex flex-col gap-4" onSubmit={submitEmail}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <FieldContent>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              required
            />
          </FieldContent>
        </Field>
      </FieldGroup>
      <FieldError>{error}</FieldError>
      <Button type="submit" disabled={isSubmitting || !email}>
        {isSubmitting ? "Sending..." : "Send code"}
      </Button>
    </form>
  ) : (
    <form className="flex flex-col gap-4" onSubmit={submitOtp}>
      <div className="space-y-1">
        <p className="text-sm font-medium">Check your email</p>
        <p className="text-sm text-muted-foreground">We sent a six-digit code to {email}.</p>
      </div>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="otp">Verification code</FieldLabel>
          <FieldContent>
            <Input
              id="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
              placeholder="123456"
              required
            />
          </FieldContent>
        </Field>
      </FieldGroup>
      <FieldError>{error}</FieldError>
      <div className="flex items-center justify-between gap-3 text-sm">
        <button
          type="button"
          className="text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => {
            setOtp("");
            setError(null);
            setStep("email");
          }}
        >
          Use another email
        </button>
        <button
          type="button"
          className="text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => {
            void resendCode();
          }}
          disabled={isSubmitting}
        >
          Resend code
        </button>
      </div>
      <Button type="submit" disabled={isSubmitting || otp.length < 6}>
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
