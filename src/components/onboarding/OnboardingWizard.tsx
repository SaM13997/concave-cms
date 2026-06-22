import { Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { CheckCircle2, FileText, Layers, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";

type OnboardingStep = "welcome" | "schema" | "content" | "publish" | "complete";

const STEPS: Array<{ id: OnboardingStep; label: string; icon: typeof Layers }> = [
  { id: "welcome", label: "Welcome", icon: Rocket },
  { id: "schema", label: "Blog schema", icon: Layers },
  { id: "content", label: "First post", icon: FileText },
  { id: "publish", label: "Publish", icon: CheckCircle2 },
];

function stepIndex(step: OnboardingStep): number {
  if (step === "complete") return STEPS.length;
  return STEPS.findIndex((item) => item.id === step);
}

export function OnboardingWizard() {
  const status = useQuery(api.onboarding.getStatus);
  const completeOnboarding = useMutation(api.onboarding.completeOnboarding);
  const dismissOnboarding = useMutation(api.onboarding.dismissOnboarding);

  if (!status?.showWizard) {
    return null;
  }

  const activeIndex = stepIndex(status.step);

  const handleFinish = () => {
    void completeOnboarding();
  };

  const handleSkip = () => {
    void dismissOnboarding();
  };

  return (
    <section
      data-testid="onboarding-wizard"
      className="rounded-lg border border-border bg-card p-6 shadow-sm"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-card-foreground">
            Get started in under 2 minutes
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a Blog content type, write your first post, and publish it to the web.
          </p>
        </div>
        <button
          type="button"
          data-testid="onboarding-skip"
          onClick={handleSkip}
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          Skip for now
        </button>
      </div>

      <ol className="mt-6 flex flex-wrap gap-3" aria-label="Onboarding progress">
        {STEPS.map((step, index) => {
          const done = index < activeIndex || status.step === "complete";
          const current = step.id === status.step;
          const Icon = done ? CheckCircle2 : step.icon;
          return (
            <li
              key={step.id}
              data-testid={`onboarding-step-${step.id}`}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
                done && "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
                current && !done && "border-primary bg-primary/10 text-foreground",
                !done && !current && "border-border text-muted-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {step.label}
            </li>
          );
        })}
      </ol>

      <div
        data-testid={`onboarding-panel-${status.step}`}
        className="mt-6 rounded-md border border-border bg-muted/30 p-4"
      >
        {status.step === "schema" && (
          <>
            <p className="text-sm text-muted-foreground">
              Open the schema builder, create a table named{" "}
              <strong className="text-foreground">Blog</strong>, add a{" "}
              <strong className="text-foreground">Body</strong> rich-text field, and apply the
              schema.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild data-testid="onboarding-start">
                <Link to="/schema" search={{ onboarding: "1" }}>
                  Start — create Blog schema
                </Link>
              </Button>
              <Button asChild variant="outline" data-testid="onboarding-goto-schema">
                <Link to="/schema" search={{ onboarding: "1" }}>
                  Open schema builder
                </Link>
              </Button>
            </div>
          </>
        )}

        {status.step === "content" && (
          <>
            <p className="text-sm text-muted-foreground">
              Your Blog schema is active. Create your first post and save a draft.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild data-testid="onboarding-goto-content">
                <Link to="/content" search={{ type: "blog", onboarding: "1" }}>
                  Create first post
                </Link>
              </Button>
            </div>
          </>
        )}

        {status.step === "publish" && (
          <>
            <p className="text-sm text-muted-foreground">
              Open your draft, add content, and click{" "}
              <strong className="text-foreground">Publish</strong> to make it live.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild data-testid="onboarding-goto-publish">
                <Link to="/content" search={{ type: "blog", onboarding: "1" }}>
                  Open Blog posts
                </Link>
              </Button>
            </div>
          </>
        )}

        {status.step === "complete" && (
          <>
            <p className="text-sm text-emerald-200">
              <CheckCircle2 className="mr-1 inline h-4 w-4" aria-hidden />
              Your first post is published. You are ready to use Concave CMS.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button data-testid="onboarding-complete" onClick={handleFinish}>
                Finish onboarding
              </Button>
              <Button variant="outline" asChild>
                <Link to="/content" search={{ type: "blog" }}>
                  View posts
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>

      {status.step !== "complete" && (
        <p className="mt-4 text-xs text-muted-foreground">
          {status.blogSchemaActive ? (
            <span data-testid="onboarding-hint-schema-done">Blog schema is active.</span>
          ) : (
            <span>Waiting for Blog schema to be applied…</span>
          )}
          {status.hasBlogEntry ? (
            <span className="ml-2" data-testid="onboarding-hint-entry-done">
              Draft post created.
            </span>
          ) : null}
        </p>
      )}
    </section>
  );
}

export function OnboardingBanner({ step }: { step: "schema" | "content" }) {
  if (step === "schema") {
    return (
      <div
        data-testid="onboarding-schema-banner"
        className="mb-4 rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground"
      >
        <strong>Onboarding:</strong> Create a table named <em>Blog</em>, add a Body (richtext)
        field, then click Apply.
      </div>
    );
  }

  return (
    <div
      data-testid="onboarding-content-banner"
      className="mb-4 rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground"
    >
      <strong>Onboarding:</strong> Create a post, save your draft, then publish when ready.
    </div>
  );
}
