import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth/config";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import ProjectsList from "@/components/projects/ProjectsList";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <>
      <h1 className="text-3xl font-bold">
        OpsPilot Dashboard
      </h1>

      <p className="mt-2">
        Welcome, {session.user?.name || "User"}
      </p>

      <p className="mb-8">
        Role: {session.user?.role || "Developer"}
      </p>

      <DashboardOverview />

      <section className="mt-10">
        <h2 className="mb-4 text-2xl font-semibold">
          Projects
        </h2>

        <ProjectsList />
      </section>
    </>
  );
}