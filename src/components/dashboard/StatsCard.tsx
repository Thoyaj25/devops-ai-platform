type Props = {
  title: string;
  value: string | number;
  description: string;
};

export default function StatsCard({
  title,
  value,
  description,
}: Props) {
  return (
    <div className="rounded-lg border p-6">
      <h3 className="text-sm text-gray-500">
        {title}
      </h3>

      <p className="mt-2 text-3xl font-bold">
        {value}
      </p>

      <p className="mt-2 text-sm text-gray-600">
        {description}
      </p>
    </div>
  );
}