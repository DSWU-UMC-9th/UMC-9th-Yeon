import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
};

export default function Button({ loading, disabled, className, children, ...rest }: Props) {
  const isDisabled = loading || disabled;
  return (
    <button
      disabled={isDisabled}
      {...rest}
      className={[
        "w-full rounded-md px-4 py-2 text-sm font-semibold transition",
        isDisabled ? "bg-pink-300/40 cursor-not-allowed text-gray-200" : "bg-pink-500 hover:bg-pink-600 text-white",
        className ?? "",
      ].join(" ")}
    >
      {loading ? "처리 중..." : children}
    </button>
  );
}
