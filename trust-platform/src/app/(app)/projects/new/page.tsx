import Link from "next/link";

import { ProjectForm } from "@/components/project-form";

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <Link href="/dashboard" className="text-sm font-medium text-zinc-500">
          ← Back to dashboard
        </Link>
        <h1 className="mt-4 text-3xl font-semibold text-zinc-950 text-balance">
          Add a completed project
        </h1>
        <p className="mt-3 max-w-2xl text-zinc-600 text-pretty">
          Create the factual draft that a company reviewer can safely approve.
          You will decide what becomes public after verification.
        </p>
      </div>
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <ProjectForm />
      </div>
    </div>
  );
}
