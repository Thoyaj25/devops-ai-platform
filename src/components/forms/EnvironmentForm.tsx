"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";

type Props = {
  projectId: string;
};

export default function EnvironmentForm({
  projectId,
}: Props) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [type, setType] = useState("DEVELOPMENT");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);

    try {
      const response = await fetch("/api/environments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          name,
          type,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create environment");
      }

      setName("");
      setType("DEVELOPMENT");

      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Unable to create environment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card
      title="Create Environment"
      description="Add a deployment environment to this project."
      className="mt-8"
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <div>
          <label className="mb-2 block text-sm font-medium">
            Environment Name
          </label>

          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Environment Type
          </label>

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-md border px-4 py-2"
          >
            <option value="DEVELOPMENT">
              DEVELOPMENT
            </option>

            <option value="STAGING">
              STAGING
            </option>

            <option value="PRODUCTION">
              PRODUCTION
            </option>
          </select>
        </div>

        <Button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Creating..."
            : "Create Environment"}
        </Button>
      </form>
    </Card>
  );
}