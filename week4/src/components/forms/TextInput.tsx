import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export default function TextInput({ label, error, className, ...rest }: Props) {
  return (
    <label className="block w-full">
      {label && <span className="mb-2 block text-sm text-gray-300">{label}</span>}
      <input
        {...rest}
        className={[
          "w-full rounded-md border bg-transparent px-4 py-2 text-sm outline-none transition",
          "placeholder:text-gray-500",
          error ? "border-red-500 focus:border-red-400" : "border-gray-700 focus:border-pink-400",
          className ?? "",
        ].join(" ")}
      />
      {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}
    </label>
  );
}
