import Link from "next/link";

import Button from "@/components/ui/Button";
import ProjectsList from "@/components/projects/ProjectsList";

export default function ProjectsPage() {
  return (
    <main className="mx-auto max-w-5xl p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          Projects
        </h1>

        <Link href="/projects/new">
          <Button>
            Create Project
          </Button>
        </Link>
      </div>

      <ProjectsList />
    </main>
  );
}