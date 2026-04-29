import { LoginShell } from "@/components/auth/LoginShell";

export const metadata = { title: "Sign in" };

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: "Google didn't return an authorization code. Please try again.",
  oauth_failed: "We couldn't complete sign-in with Google. Please try again.",
};

type LoginPageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next, error } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : undefined;
  const errorMessage = error
    ? (ERROR_MESSAGES[error] ?? "Something went wrong. Please try again.")
    : null;

  return <LoginShell next={safeNext} errorMessage={errorMessage} />;
}
