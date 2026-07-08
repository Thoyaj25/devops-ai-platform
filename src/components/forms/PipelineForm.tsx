"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";

type Props = {
  projectId: string;
};

export default function PipelineForm({
  projectId,
}: Props) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [provider, setProvider] = useState("");
  const [repository, setRepository] =
    useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);

    try {
      const response = await fetch(
        "/api/pipelines",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name,
            provider,
            repository,
            projectId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to create pipeline"
        );
      }

      setName("");
      setProvider("");
      setRepository("");

      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Unable to create pipeline.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card
      title="Create Pipeline"
      description="Register a CI/CD pipeline for this project."
      className="mt-8"
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <div>
          <label className="mb-2 block text-sm font-medium">
            Name
          </label>

          <Input
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Provider
          </label>

          <Input
            value={provider}
            onChange={(e) =>
              setProvider(e.target.value)
            }
            placeholder="github"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Repository URL
          </label>

          <Input
            value={repository}
            onChange={(e) =>
              setRepository(e.target.value)
            }
            placeholder="https://github.com/org/repo"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Creating..."
            : "Create Pipeline"}
        </Button>
      </form>
    </Card>
  );
}