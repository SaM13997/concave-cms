import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";

type InsufficientPermissionsProps = {
  requiredPermission?: string;
};

export function InsufficientPermissions({ requiredPermission }: InsufficientPermissionsProps) {
  return (
    <div
      data-testid="insufficient-permissions"
      className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <ShieldAlert className="h-6 w-6 text-destructive" />
      </div>
      <div className="space-y-2">
        <h1 className="text-lg font-semibold">Insufficient permissions</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          You do not have access to this area.
          {requiredPermission ? ` Required: ${requiredPermission}.` : null} Contact an administrator
          if you need elevated access.
        </p>
      </div>
      <Link
        to="/"
        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        data-testid="insufficient-permissions-home"
      >
        Return to dashboard
      </Link>
    </div>
  );
}
