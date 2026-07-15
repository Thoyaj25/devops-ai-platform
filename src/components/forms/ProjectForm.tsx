"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";

export default function ProjectForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          status,
        }),
      });

      const result = await response.json();

      // Standardized pattern: check for success and extract data safely
      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "Failed to create project");
      }

      const project = result.data;

      router.push(`/projects/${project.id}`);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Unable to create project.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card
      title="Create Project"
      description="Create a new DevOps project."
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <div>
          <label className="mb-2 block text-sm font-medium">
            Project Name
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
            Description
          </label>

          <Input
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Status
          </label>

          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value)
            }
            className="w-full rounded-md border px-4 py-2"
          >
            <option value="ACTIVE">
              ACTIVE
            </option>

            <option value="ARCHIVED">
              ARCHIVED
            </option>
          </select>
        </div>

        <Button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Creating..."
            : "Create Project"}
        </Button>
      </form>
    </Card>
  );
}