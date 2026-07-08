type Props = {
  title: string;
  description?: string;
};

export default function EmptyState({
  title,
  description,
}: Props) {
  return (
    <div className="rounded-lg border border-dashed p-10 text-center">
      <h3 className="text-lg font-semibold">
        {title}
      </h3>

      {description && (
        <p className="mt-2 text-gray-500">
          {description}
        </p>
      )}
    </div>
  );
}