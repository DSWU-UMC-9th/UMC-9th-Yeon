import { useQuery } from "@tanstack/react-query";
import client from "../api/client";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface MeResponse {
  id: number;
  email: string;
  name: string;
  profileImageUrl: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
}

async function fetchMe(token?: string | null): Promise<MeResponse> {
  const { data } = await client.get("/users/me", {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return data;
}

export default function MyPage() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["me", token],
    queryFn: () => fetchMe(token),
    enabled: !!token,
    retry: false,
  });

  console.log("[MyPage] token:", token);
  console.log("[MyPage] data:", data);
  console.log("[MyPage] error:", error);

  if (isLoading) return <div className="p-6">로딩 중...</div>;
  if (error)
    return (
      <div className="p-6 space-y-3">
        <div className="text-red-400">에러가 발생했습니다.</div>
        <button
          onClick={() => navigate("/login", { replace: true })}
          className="px-3 py-2 rounded bg-neutral-800 hover:bg-neutral-700"
        >
          로그인 페이지로 이동
        </button>
      </div>
    );
  if (!data) return <div className="p-6">데이터 없음</div>;

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">마이페이지</h1>

      <div className="flex flex-col items-center gap-4 p-6 rounded bg-neutral-900 border border-neutral-800">
        {/* 프로필 이미지 */}
        <img
          src={data.profileImageUrl ?? "/default-profile.png"}
          className="w-28 h-28 rounded-full object-cover border border-neutral-700"
        />

        {/* 이름 / 이메일 */}
        <div className="text-center">
          <p className="text-lg font-semibold">{data.name}</p>
          <p className="text-sm text-neutral-400">{data.email}</p>
        </div>

        {/* 가입일 */}
        <div className="text-sm text-neutral-400">가입일: {new Date(data.createdAt).toLocaleDateString()}</div>

        {/* 역할 */}
        <span className="px-3 py-1 rounded-full text-xs bg-neutral-800 border border-neutral-700">{data.role}</span>
      </div>
    </div>
  );
}
