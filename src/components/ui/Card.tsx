import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  title?: string;
  description?: string;
  children: ReactNode;
};

export default function Card({
  title,
  description,
  children,
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      {...props}
      className={`rounded-xl border bg-white p-6 shadow-sm ${className}`}
    >
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-lg font-semibold">
              {title}
            </h3>
          )}

          {description && (
            <p className="mt-1 text-sm text-gray-500">
              {description}
            </p>
          )}
        </div>
      )}

      {children}
    </div>
  );
}