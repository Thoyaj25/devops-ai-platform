import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement>;

export default function Input({
  className = "",
  ...props
}: Props) {
  return (
    <input
      {...props}
      className={`w-full rounded-md border px-4 py-2 outline-none focus:ring-2 focus:ring-black ${className}`}
    />
  );
}