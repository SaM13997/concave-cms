type BlockerNoticeProps = {
  blockerId: string;
  message: string;
};

export function BlockerNotice({ blockerId, message }: BlockerNoticeProps) {
  return (
    <p
      className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200"
      data-blocker={blockerId}
    >
      {message}
    </p>
  );
}
