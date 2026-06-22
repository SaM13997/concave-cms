import { useRouter } from "@tanstack/react-router";
import { ArrowRight, GalleryVerticalEnd } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type LoginFormProps = React.ComponentProps<"div"> & {
  redirect?: string;
  sessionExpired?: boolean;
};

export function LoginForm({
  className,
  redirect,
  sessionExpired = false,
  ...props
}: LoginFormProps) {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigateAfterAuth = () => {
    if (redirect && redirect.length > 0) {
      router.history.push(redirect);
      return;
    }

    router.navigate({ to: "/" });
  };

  const handleEmailAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    if (typeof email !== "string" || email.length === 0) {
      setError("Email is required.");
      setIsLoading(false);
      return;
    }

    if (typeof password !== "string" || password.length === 0) {
      setError("Password is required.");
      setIsLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const name = formData.get("name");
        const displayName = typeof name === "string" && name.length > 0 ? name : email;
        await authClient.signUp.email({
          email,
          password,
          name: displayName,
        });
      } else {
        await authClient.signIn.email({ email, password });
      }
      navigateAfterAuth();
    } catch (_err) {
      setError(isSignUp ? "Sign up failed. Please try again." : "Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await authClient.signIn.social({
        provider: "google",
      });
      navigateAfterAuth();
    } catch (_err) {
      setError("Google sign-in failed. Please try again.");
    }
  };

  return (
    <div className={cn("app-panel rounded-[2rem] px-6 py-6 sm:px-8", className)} {...props}>
      <form onSubmit={handleEmailAuth}>
        <FieldGroup className="gap-5">
          <div className="space-y-4 text-left">
            <a href="/" className="inline-flex items-center gap-3 font-medium text-foreground">
              <span className="grid size-11 place-items-center rounded-2xl bg-secondary text-secondary-foreground shadow-sm">
                <GalleryVerticalEnd className="size-5" />
              </span>
              <span>
                <span className="block text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Concave CMS
                </span>
                <span className="block text-lg font-semibold">Content operations</span>
              </span>
            </a>

            <div>
              <h1 className="text-[clamp(2rem,4vw,2.9rem)] font-semibold leading-[0.95] text-foreground">
                {isSignUp ? "Create your workspace account." : "Sign in to the command surface."}
              </h1>
              <FieldDescription className="mt-3 text-sm leading-6">
                {isSignUp ? "Already have access? " : "Need an account first? "}
                <button
                  type="button"
                  className="font-semibold text-foreground underline underline-offset-4"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError(null);
                  }}
                >
                  {isSignUp ? "Sign in" : "Create one"}
                </button>
              </FieldDescription>
            </div>
          </div>

          {sessionExpired ? (
            <output
              aria-live="polite"
              aria-atomic="true"
              className="rounded-[1.2rem] border border-[color:color-mix(in_oklch,var(--accent)_60%,var(--border))] bg-accent/70 px-4 py-3 text-sm text-accent-foreground"
            >
              Your session expired. Sign in again to keep editing safely.
            </output>
          ) : null}

          {error ? (
            <p className="rounded-[1.2rem] border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          {isSignUp ? (
            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                id="name"
                type="text"
                name="name"
                placeholder="Your name"
                autoComplete="name"
                className="h-11 rounded-2xl bg-white/82"
              />
            </Field>
          ) : null}

          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              name="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="h-11 rounded-2xl bg-white/82"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              name="password"
              placeholder="Enter your password"
              required
              autoComplete={isSignUp ? "new-password" : "current-password"}
              className="h-11 rounded-2xl bg-white/82"
            />
          </Field>
          <Field>
            <Button type="submit" className="h-11 w-full rounded-full" disabled={isLoading}>
              {isLoading ? "Loading..." : isSignUp ? "Create account" : "Sign in"}
              {!isLoading ? <ArrowRight className="size-4" aria-hidden="true" /> : null}
            </Button>
          </Field>
          <FieldSeparator>Or</FieldSeparator>
          <Field>
            <Button
              variant="outline"
              type="button"
              className="h-11 w-full rounded-full bg-white/82"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                role="img"
                aria-label="Google"
                className="size-4"
              >
                <title>Google</title>
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  fill="currentColor"
                />
              </svg>
              Continue with Google
            </Button>
          </Field>
        </FieldGroup>
      </form>

      <FieldDescription className="mt-5 text-center text-xs leading-6">
        By continuing, you agree to our <a href="/terms">Terms of Service</a> and{" "}
        <a href="/privacy">Privacy Policy</a>.
      </FieldDescription>
    </div>
  );
}
