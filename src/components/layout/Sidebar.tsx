import Link from "next/link";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
  },
  {
    name: "Projects",
    href: "/dashboard/projects",
  },
  {
    name: "Deployments",
    href: "/dashboard/deployments",
  },
  {
    name: "Pipelines",
    href: "/dashboard/pipelines",
  },
  {
    name: "Clusters",
    href: "/dashboard/clusters",
  },
  {
    name: "Monitoring",
    href: "/dashboard/monitoring",
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
  },
];

export default function Sidebar() {
  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-white">
      <div className="border-b p-6">
        <h1 className="text-2xl font-bold">
          MarketSphere
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          DevOps Control Plane
        </p>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-md px-4 py-3 text-sm font-medium transition hover:bg-gray-100"
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}