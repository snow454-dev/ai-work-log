export default async function ReviewerReviewPlaceholderPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;

  return (
    <main className="min-h-dvh bg-zinc-50 px-5 py-10 text-zinc-950">
      <div className="mx-auto max-w-2xl rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-zinc-500">
          Reviewer session active
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-zinc-950 text-balance">
          Ready for company review
        </h1>
        <p className="mt-3 text-zinc-600 text-pretty">
          Request {requestId} is authenticated. The approval/correction form is
          the next MVP step.
        </p>
      </div>
    </main>
  );
}
