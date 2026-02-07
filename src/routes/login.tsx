import { createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "@/components/login-form";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="flex flex-col items-center px-4 justify-center h-screen">
      <LoginForm />
    </div>
  );
}
