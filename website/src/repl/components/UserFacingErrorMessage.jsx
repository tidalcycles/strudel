// type Props = { error: Error | null };
export default function UserFacingErrorMessage(Props) {
  const { error } = Props;
  if (error == null) {
    return;
  }
  return (
    <div className="text-background px-2 py-1 bg-foreground w-full ml-auto">
      Error: {error.message || 'Unknown Error :-/'}
    </div>
  );
}
