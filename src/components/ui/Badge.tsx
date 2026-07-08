import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function Badge({
  children,
}: Props) {
  return (
    <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">
      {children}
    </span>
  );
}