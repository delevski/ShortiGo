export function formatAuthError(error: unknown): string {
  const message = error instanceof Error ? error.message : "Authentication failed.";
  if (message.includes("auth/unauthorized-domain")) {
    return "Sign-in blocked for this site. Open http://localhost:5173 (not 127.0.0.1) or add this domain in Firebase Console → Authentication → Settings → Authorized domains.";
  }
  return message;
}
