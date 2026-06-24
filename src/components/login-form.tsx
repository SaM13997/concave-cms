import { Link, useRouter } from "@tanstack/react-router";
import { GalleryVerticalEnd } from "lucide-react";
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
import { getPostLoginPath } from "@/lib/auth-redirect";
import { cn } from "@/lib/utils";

export function LoginForm({
  className,
  initialMode = "signin",
  ...props
}: React.ComponentProps<"div"> & { initialMode?: "signin" | "signup" }) {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(initialMode === "signup");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigateAfterAuth = () => {
    const search = router.state.location.search as { redirect?: unknown } | undefined;
    const redirect = typeof search?.redirect === "string" ? search.redirect : undefined;
    const target = getPostLoginPath(redirect);
    router.navigate({ to: target });
  };

  const handleEmailAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    if (typeof email !== "string" || email.length === 0) {
      setError("Email is required");
      setIsLoading(false);
      return;
    }

    if (typeof password !== "string" || password.length === 0) {
      setError("Password is required");
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
    <div className={cn("flex flex-col gap-6", className)} data-testid="login-form" {...props}>
      <form onSubmit={handleEmailAuth} method="post" action="#">
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <a href="/" className="flex flex-col items-center gap-2 font-medium">
              <div className="flex size-8 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-6" />
              </div>
              <span className="sr-only">Concave CMS</span>
            </a>
            <h1 className="text-xl font-bold" data-testid="login-heading">
              {isSignUp ? "Create your account" : "Sign in to Concave"}
            </h1>
            <FieldDescription>
              {isSignUp ? "Already have an account? " : "Don't have an account? "}
              <button
                type="button"
                data-testid="login-toggle-mode"
                className="underline underline-offset-2 hover:text-foreground"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                }}
              >
                {isSignUp ? "Sign in" : "Sign up"}
              </button>
            </FieldDescription>
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center" data-testid="login-error">
              {error}
            </p>
          )}

          {isSignUp && (
            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                id="name"
                type="text"
                name="name"
                data-testid="login-name"
                placeholder="Your name"
                autoComplete="name"
              />
            </Field>
          )}
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              name="email"
              data-testid="login-email"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              name="password"
              data-testid="login-password"
              placeholder="••••••••"
              required
              autoComplete={isSignUp ? "new-password" : "current-password"}
            />
          </Field>
          <Field>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="login-submit"
            >
              {isLoading ? "Loading..." : isSignUp ? "Create account" : "Sign in"}
            </Button>
          </Field>
          <FieldSeparator>Or</FieldSeparator>
          <Field>
            <Button
              variant="outline"
              type="button"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                role="img"
                aria-label="Google"
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
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our{" "}
        <Link to="/terms" className="underline underline-offset-2 hover:text-foreground">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground">
          Privacy Policy
        </Link>
        .
      </FieldDescription>
    </div>
  );
}
