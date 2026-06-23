import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main
      data-testid="privacy-page"
      className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-10"
    >
      <p className="mb-6">
        <Link to="/login" className="text-sm text-muted-foreground underline underline-offset-2">
          Back to sign in
        </Link>
      </p>
      <header className="mb-6 space-y-2 border-b border-border pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: June 23, 2026</p>
      </header>
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          This policy describes how Concave CMS handles information when you sign in and use the
          admin application.
        </p>
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">Information we collect</h2>
          <p>
            We collect account details such as your email address and name, authentication session
            data, and content you create or upload while using the service.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">How we use information</h2>
          <p>
            Account and session information is used to authenticate you, protect access to your
            workspace, and operate core CMS features such as content editing and publishing.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">Data retention</h2>
          <p>
            Content and account data are retained for as long as your workspace needs them. Your
            administrator controls backup, export, and deletion policies for this deployment.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">Contact</h2>
          <p>
            For privacy questions, contact your workspace administrator or the team operating this
            Concave CMS deployment.
          </p>
        </section>
      </div>
    </main>
  );
}
