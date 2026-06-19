import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { PresenceUser } from "@/lib/mock/content";
import { cn } from "@/lib/utils";

type PresenceAvatarsProps = {
  users: PresenceUser[];
  className?: string;
};

export function PresenceAvatars({ users, className }: PresenceAvatarsProps) {
  if (users.length === 0) {
    return null;
  }

  return (
    <output
      className={cn("flex items-center gap-2", className)}
      aria-label={`${users.length} collaborator${users.length === 1 ? "" : "s"} editing`}
      data-blocker="BE-008"
      title="BLOCKER(BE-008): Live presence requires Phase 7 backend"
    >
      <span className="text-xs text-muted-foreground">Also editing</span>
      <div className="flex -space-x-2">
        {users.map((user) => (
          <Avatar key={user.id} className="size-7 border-2 border-background" title={user.name}>
            <AvatarFallback className={cn("text-[10px] font-medium text-white", user.color)}>
              {user.initials}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
    </output>
  );
}
