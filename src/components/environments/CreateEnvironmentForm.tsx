"use client";

import { useState } from "react";

type Props = {
  projectId: string;
};

export default function CreateEnvironmentForm({
  projectId,
}: Props) {
  const [name, setName] = useState("");
  const [type, setType] = useState("DEVELOPMENT");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setLoading(true);

    const response = await fetch(
      "/api/environments",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          name,
          type,
        }),
      }
    );

    setLoading(false);

    if (!response.ok) {
      alert("Failed to create environment");
      return;
    }

    window.location.reload();
  }

  return (
    <section className="mt-8 rounded-lg border p-5">
      <h3 className="text-lg font-semibold">
        Create Environment
      </h3>

      <form
        onSubmit={handleSubmit}
        className="mt-4 space-y-4"
      >
        <div>
          <label className="block text-sm font-medium">
            Name
          </label>

          <input
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            placeholder="production"
            className="mt-1 w-full rounded border p-2"
            required
          />
        </div>


        <div>
          <label className="block text-sm font-medium">
            Type
          </label>

          <select
            value={type}
            onChange={(e) =>
              setType(e.target.value)
            }
            className="mt-1 w-full rounded border p-2"
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


        <button
          disabled={loading}
          className="rounded bg-black px-4 py-2 text-white"
        >
          {loading
            ? "Creating..."
            : "Create Environment"}
        </button>
      </form>
    </section>
  );
}