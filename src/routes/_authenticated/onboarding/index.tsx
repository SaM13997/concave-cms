import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ChevronRight, PartyPopper } from "lucide-react";
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
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader
        title="Get started"
        description="Create a Blog content type and publish your first post in under 2 minutes."
      />

      <ol className="space-y-3" aria-label="Onboarding steps">
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
                "flex items-start gap-3 rounded-lg border p-4 transition-colors",
                isCurrent ? "border-primary/40 bg-primary/5" : "border-border bg-card",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  isComplete
                    ? "bg-emerald-500/20 text-emerald-300"
                    : isCurrent
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                )}
                aria-hidden="true"
              >
                {isComplete ? <Check className="h-4 w-4" /> : step}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              {!isCurrent && step <= progress.currentStep ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => goToStep(step)}>
                  Edit
                </Button>
              ) : null}
            </li>
          );
        })}
      </ol>

      <div className="rounded-lg border border-border bg-card p-6">
        {progress.currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-base font-medium">Step 1: Create Blog type</h2>
            <p className="text-sm text-muted-foreground">
              We'll add a <strong className="font-medium text-foreground">Blog</strong> content type
              with a posts collection.
            </p>
            <Button type="button" onClick={handleCreateBlog}>
              Create Blog type
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        )}

        {progress.currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-base font-medium">Step 2: Add Post fields</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                Title — short text
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                Body — rich text
              </li>
            </ul>
            <Button type="button" onClick={handleAddFields}>
              Add fields
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        )}

        {progress.currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-base font-medium">Step 3: Create first post</h2>
            <div className="space-y-2">
              <Label htmlFor="post-title">Post title</Label>
              <Input
                id="post-title"
                value={progress.postTitle}
                onChange={(event) => persist({ ...progress, postTitle: event.target.value })}
                placeholder="Hello, world!"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="post-body">Post body</Label>
              <textarea
                id="post-body"
                value={progress.postBody}
                onChange={(event) => persist({ ...progress, postBody: event.target.value })}
                placeholder="Write your first post…"
                rows={4}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <Button type="button" onClick={handleCreatePost} disabled={!progress.postTitle.trim()}>
              Continue
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        )}

        {progress.currentStep === 4 && !progress.published && (
          <div className="space-y-4">
            <h2 className="text-base font-medium">Step 4: Publish</h2>
            <div className="rounded-md border border-border bg-muted/30 p-4">
              <p className="text-sm font-medium text-foreground">{progress.postTitle}</p>
              {progress.postBody ? (
                <p className="mt-2 text-sm text-muted-foreground">{progress.postBody}</p>
              ) : (
                <p className="mt-2 text-sm italic text-muted-foreground">No body content</p>
              )}
            </div>
            <Button type="button" onClick={handlePublish}>
              Publish post
            </Button>
          </div>
        )}

        {progress.published && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
              <PartyPopper className="h-6 w-6 text-emerald-300" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">You're all set!</h2>
            <p className="text-sm text-muted-foreground">
              Your Blog type and first post are ready. Content will sync to Convex when the backend
              is connected.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild variant="default">
                <Link to="/content">View content</Link>
              </Button>
              <Button type="button" variant="outline" onClick={handleReset}>
                Start over
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
