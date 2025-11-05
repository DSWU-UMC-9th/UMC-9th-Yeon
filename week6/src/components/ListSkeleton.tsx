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

/** 고정 픽셀 카드(180x180) 그리드 스켈레톤 */
export function CardGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse space-y-2 w-[180px]">
          <div className="w-[180px] h-[180px] rounded bg-neutral-800" />
          <div className="h-3 w-[135px] bg-neutral-800 rounded" />
          <div className="h-3 w-[90px] bg-neutral-800 rounded" />
        </div>
      ))}
    </div>
  );
}

/** 댓글 리스트 스켈레톤 (아바타 + 2줄 텍스트) */
// export function CommentsSkeleton({ count = 10 }: { count?: number }) {
//   return (
//     <div className="animate-pulse space-y-4">
//       {Array.from({ length: count }).map((_, i) => (
//         <div key={i} className="flex gap-3">
//           <div className="h-8 w-8 rounded-full bg-neutral-600" />
//           <div className="flex-1 space-y-2">
//             <div className="h-3 w-1/3 bg-neutral-600 rounded" />
//             <div className="h-3 w-3/4 bg-neutral-600 rounded" />
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// }

// ListSkeleton.tsx
export function CommentsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <ul className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="flex items-start gap-3">
          {/* avatar 32x32 (h-8 w-8) */}
          <div className="h-8 w-8 rounded-full bg-neutral-700/60 animate-pulse" />

          {/* text block */}
          <div className="flex-1">
            {/* name: text-sm 정도 높이 */}
            <div className="h-4 w-28 rounded bg-neutral-400/30 animate-pulse" />

            {/* time: text-xs, 위아래 간격 동일하게 */}
            <div className="h-3 w-16 rounded bg-neutral-400/20 mt-1 mb-2 animate-pulse" />

            {/* content lines: text-sm 두 줄 */}
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-neutral-400/30 animate-pulse" />
            </div>
          </div>

          {/* more 버튼 자리(우상단 16px 근사치) */}
          <div className="h-4 w-4 rounded bg-neutral-500/30 animate-pulse" />
        </li>
      ))}
    </ul>
  );
}
