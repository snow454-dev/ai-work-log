import Link from "next/link";

import { ProfileForm } from "@/components/profile-form";
import { getCurrentUserId } from "@/data/auth";
import { getProfileForUser } from "@/data/profiles";

export default async function OnboardingPage() {
  const userId = await getCurrentUserId();
  const profile = await getProfileForUser(userId);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <Link href="/dashboard" className="text-sm font-medium text-zinc-500">
          ← Back to dashboard
        </Link>
        <h1 className="mt-4 text-3xl font-semibold text-zinc-950 text-balance">
          Set up your public proof profile
        </h1>
        <p className="mt-3 text-zinc-600 text-pretty">
          This is the identity companies will verify against. Keep it clear and
          professional; you can refine the public copy later.
        </p>
      </div>
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <ProfileForm profile={profile} />
      </div>
    </div>
  );
}
