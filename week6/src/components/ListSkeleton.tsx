// week6/src/components/ListSkeleton.tsx
import React from "react";

/** 카드형 리스트/상세 공통 로딩 스켈레톤 */
export default function ListSkeleton() {
  return (
    <div className="max-w-3xl mx-auto rounded border border-neutral-800 bg-neutral-900/40 p-4 md:p-6 animate-pulse space-y-4">
      <div className="h-6 w-2/3 rounded bg-neutral-800" />
      <div className="h-4 w-1/3 rounded bg-neutral-800" />
      <div className="aspect-video w-full rounded bg-neutral-800" />
      <div className="h-24 w-full rounded bg-neutral-800" />
      <div className="flex gap-2 pt-2">
        <div className="h-8 w-16 rounded bg-neutral-800" />
        <div className="h-8 w-16 rounded bg-neutral-800" />
        <div className="h-8 w-16 rounded bg-neutral-800" />
      </div>
    </div>
  );
}
