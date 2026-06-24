import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
});

function TermsPage() {
  return (
    <main
      data-testid="terms-page"
      className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-10"
    >
      <p className="mb-6">
        <Link
          to="/login"
          className="inline-flex min-h-11 items-center text-sm text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
        >
          Back to sign in
        </Link>
      </p>
      <header className="mb-6 space-y-2 border-b border-border pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">Last updated: June 23, 2026</p>
      </header>
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          Concave CMS provides a content management platform for creating, editing, and publishing
          content. By creating an account or using the service, you agree to these terms.
        </p>
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">Acceptable use</h2>
          <p>
            You are responsible for the content you publish and for keeping your account credentials
            secure. Do not use the service for unlawful activity or to interfere with other users.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">Service availability</h2>
          <p>
            We aim to keep Concave CMS available and reliable, but the service is provided as-is and
            may change or be interrupted for maintenance or operational reasons.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">Contact</h2>
          <p>
            Questions about these terms can be directed to your workspace administrator or the team
            operating this Concave CMS deployment.
          </p>
        </section>
      </div>
    </main>
  );
}
