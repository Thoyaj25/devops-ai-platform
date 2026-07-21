import Link from "next/link";

export default function HomePage() {
  const platformName = "MarketSphere";

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center p-8">
      <h1 className="text-5xl font-bold">
        {platformName}
      </h1>

      <p className="mt-4 text-lg text-gray-600">
        A production-grade DevOps platform for managing projects,
        environments, pipelines, and deployments.
      </p>

      <div className="mt-8 flex gap-4">
        <Link
          href="/dashboard"
          className="rounded bg-black px-5 py-3 text-white"
        >
          Open Dashboard
        </Link>
      </div>
    </main>
  );
}