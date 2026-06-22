import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ChevronRight, PartyPopper, Rocket } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/onboarding/")({
  component: OnboardingPage,
});

const STORAGE_KEY = "concave-onboarding-progress";

type OnboardingStep = 1 | 2 | 3 | 4;

type OnboardingProgress = {
  currentStep: OnboardingStep;
  blogCreated: boolean;
  fieldsAdded: boolean;
  postTitle: string;
  postBody: string;
  published: boolean;
  completedAt?: string;
};

const defaultProgress: OnboardingProgress = {
  currentStep: 1,
  blogCreated: false,
  fieldsAdded: false,
  postTitle: "",
  postBody: "",
  published: false,
};

const steps = [
  {
    step: 1 as const,
    title: "Create Blog type",
    description: "Add a Blog content type to your schema.",
  },
  {
    step: 2 as const,
    title: "Add Post fields",
    description: "Define title and body fields for posts.",
  },
  { step: 3 as const, title: "Create first post", description: "Write your first blog entry." },
  { step: 4 as const, title: "Publish", description: "Publish your post to make it live." },
];

function readProgress(): OnboardingProgress {
  if (typeof window === "undefined") return defaultProgress;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress;
    return { ...defaultProgress, ...JSON.parse(raw) };
  } catch {
    return defaultProgress;
  }
}

function writeProgress(progress: OnboardingProgress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function OnboardingPage() {
  const [progress, setProgress] = useState<OnboardingProgress>(defaultProgress);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setProgress(readProgress());
    setMounted(true);
  }, []);

  const persist = useCallback((next: OnboardingProgress) => {
    setProgress(next);
    writeProgress(next);
  }, []);

  const goToStep = (step: OnboardingStep) => {
    persist({ ...progress, currentStep: step });
  };

  const handleCreateBlog = () => {
    persist({
      ...progress,
      blogCreated: true,
      currentStep: 2,
    });
  };

  const handleAddFields = () => {
    persist({
      ...progress,
      fieldsAdded: true,
      currentStep: 3,
    });
  };

  const handleCreatePost = () => {
    if (!progress.postTitle.trim()) return;
    persist({
      ...progress,
      currentStep: 4,
    });
  };

  const handlePublish = () => {
    persist({
      ...progress,
      published: true,
      completedAt: new Date().toISOString(),
    });
  };

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setProgress(defaultProgress);
  };

  if (!mounted) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="app-grid">
      <section className="app-panel rounded-[2rem] px-6 py-6 sm:px-8 sm:py-8">
        <PageHeader
          eyebrow="Onboarding metric"
          title="Create a Blog content type and publish the first post in under two minutes."
          description="This flow turns the product promise into a guided path: schema creation, field setup, first entry, then publish."
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(19rem,1fr)]">
        <div className="app-grid">
          <ol className="grid gap-3" aria-label="Onboarding steps">
            {steps.map(({ step, title, description }) => {
              const isComplete =
                (step === 1 && progress.blogCreated) ||
                (step === 2 && progress.fieldsAdded) ||
                (step === 3 && progress.postTitle.trim().length > 0) ||
                (step === 4 && progress.published);
              const isCurrent = progress.currentStep === step;

              return (
                <li
                  key={step}
                  className={cn(
                    "rounded-[1.6rem] border px-5 py-4 transition-all",
                    isCurrent
                      ? "app-panel bg-[linear-gradient(180deg,color-mix(in_oklch,var(--secondary)_78%,white),white)]"
                      : "app-panel-soft",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                        isComplete
                          ? "bg-secondary text-secondary-foreground"
                          : isCurrent
                            ? "bg-primary text-primary-foreground"
                            : "bg-white text-muted-foreground shadow-sm",
                      )}
                      aria-hidden="true"
                    >
                      {isComplete ? <Check className="h-4 w-4" /> : step}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-foreground">{title}</p>
                          <p className="text-sm text-muted-foreground">{description}</p>
                        </div>
                        {!isCurrent && step <= progress.currentStep ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => goToStep(step)}
                          >
                            Edit
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="app-panel rounded-[1.8rem] px-6 py-6">
            {progress.currentStep === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">Step 1: Create Blog type</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  We&apos;ll add a <strong className="font-semibold text-foreground">Blog</strong>{" "}
                  content type with a posts collection.
                </p>
                <Button type="button" className="rounded-full" onClick={handleCreateBlog}>
                  Create Blog type
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            )}

            {progress.currentStep === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">Step 2: Add Post fields</h2>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-3">
                    <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                    Title - short text
                  </li>
                  <li className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-3">
                    <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                    Body - rich text
                  </li>
                </ul>
                <Button type="button" className="rounded-full" onClick={handleAddFields}>
                  Add fields
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            )}

            {progress.currentStep === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">Step 3: Create first post</h2>
                <div className="space-y-2">
                  <Label htmlFor="post-title">Post title</Label>
                  <Input
                    id="post-title"
                    value={progress.postTitle}
                    onChange={(event) => persist({ ...progress, postTitle: event.target.value })}
                    placeholder="Hello, world!"
                    className="h-11 rounded-2xl bg-white/80"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="post-body">Post body</Label>
                  <textarea
                    id="post-body"
                    value={progress.postBody}
                    onChange={(event) => persist({ ...progress, postBody: event.target.value })}
                    placeholder="Write your first post..."
                    rows={5}
                    className="flex min-h-[120px] w-full rounded-[1.3rem] border border-input bg-white/80 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <Button
                  type="button"
                  className="rounded-full"
                  onClick={handleCreatePost}
                  disabled={!progress.postTitle.trim()}
                >
                  Continue
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            )}

            {progress.currentStep === 4 && !progress.published && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">Step 4: Publish</h2>
                <div className="rounded-[1.35rem] border border-border bg-muted/40 p-4">
                  <p className="text-sm font-semibold text-foreground">{progress.postTitle}</p>
                  {progress.postBody ? (
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {progress.postBody}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm italic text-muted-foreground">No body content</p>
                  )}
                </div>
                <Button type="button" className="rounded-full" onClick={handlePublish}>
                  Publish post
                </Button>
              </div>
            )}

            {progress.published && (
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                  <PartyPopper className="h-7 w-7 text-secondary-foreground" aria-hidden="true" />
                </div>
                <h2 className="text-2xl font-semibold text-foreground">You&apos;re all set.</h2>
                <p className="mx-auto max-w-xl text-sm leading-6 text-muted-foreground">
                  Your Blog type and first post are ready. Content will sync to Convex when the
                  backend is connected.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button asChild variant="default" className="rounded-full">
                    <Link to="/content">View content</Link>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full bg-white/80"
                    onClick={handleReset}
                  >
                    Start over
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="app-grid">
          <section className="app-panel-soft rounded-[1.8rem] px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-2xl bg-white shadow-sm">
                <Rocket className="size-5 text-foreground" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Success metric</p>
                <p className="text-xs text-muted-foreground">
                  Non-technical users should feel fast, not blocked.
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {[
                "Create a content type from a starter template.",
                "Add only the fields needed to publish confidently.",
                "Preview and publish without leaving the workflow.",
              ].map((item) => (
                <div key={item} className="rounded-[1.35rem] bg-white/78 px-4 py-4 shadow-sm">
                  <p className="text-sm leading-6 text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="app-panel rounded-[1.8rem] px-5 py-5">
            <p className="app-kicker">Progress</p>
            <h2 className="mt-3 text-xl font-semibold text-foreground">Current completion state</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {progress.published
                ? "The first publish flow is complete."
                : `Step ${progress.currentStep} of 4 is active.`}
            </p>
            {progress.completedAt ? (
              <p className="mt-3 rounded-[1.15rem] bg-muted px-4 py-3 text-xs leading-5 text-muted-foreground">
                Completed on {new Date(progress.completedAt).toLocaleString()}.
              </p>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  );
}
