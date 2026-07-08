import { notFound } from "next/navigation";

import EnvironmentForm from "@/components/forms/EnvironmentForm";
import PipelineForm from "@/components/forms/PipelineForm";
import EnvironmentList from "@/components/environments/EnvironmentList";
import PipelineList from "@/components/pipelines/PipelineList";
import ProjectHeader from "@/components/projects/ProjectHeader";
import ProjectOverview from "@/components/projects/ProjectOverview";

import { projectService } from "@/services/project/projectService";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProjectPage({
  params,
}: Props) {
  const { id } = await params;

  const project = await projectService.getProject(id);

  if (!project) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-7xl p-8">
      <ProjectHeader project={project} />

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProjectOverview project={project} />

          <div className="mt-8">
            <EnvironmentList projectId={id} />
          </div>

          <div className="mt-8">
            <PipelineList projectId={id} />
          </div>
        </div>

        <div className="space-y-8">
          <EnvironmentForm projectId={id} />
          <PipelineForm projectId={id} />
        </div>
      </div>
    </main>
  );
}