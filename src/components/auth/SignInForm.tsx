import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { requestSignInCode, verifySignInCode } from "./sign-in-actions";

type SignInStep = "email" | "otp";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<SignInStep>("email");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await requestSignInCode(email);

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

    const result = await verifySignInCode(email, otp);

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
      <Button type="submit" disabled={isSubmitting || otp.length < 6}>
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
