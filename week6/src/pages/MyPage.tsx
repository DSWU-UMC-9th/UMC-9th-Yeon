import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../api/client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import editIconUrl from "../assets/edit.svg";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface MePayload {
  id: number;
  email: string;
  name: string;
  avatar?: string | null;
  profileImageUrl?: string | null;
  role?: string | null;
  createdAt: string;
  updatedAt: string;
  bio?: string | null;
}

interface MeApiResponse {
  status?: boolean;
  statusCode?: number;
  message?: string;
  data?: MePayload;
}

interface MeResponse {
  id: number;
  email: string;
  name: string;
  profileImageUrl: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
  bio: string | null;
}

async function fetchMe(token?: string | null): Promise<MeResponse> {
  const { data } = await client.get<MeApiResponse | MePayload>("/users/me", {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  const payload: MePayload | undefined = (data as MeApiResponse)?.data ?? (data as MePayload);
  if (!payload) throw new Error("빈 응답입니다.");
  return {
    id: payload.id,
    email: payload.email,
    name: payload.name,
    profileImageUrl: payload.avatar ?? payload.profileImageUrl ?? null,
    role: payload.role ?? "USER",
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
    bio: payload.bio ?? null,
  };
}

interface UpdateMeBody {
  name?: string;
  bio?: string | null;
  avatar?: string | null;
}

async function updateMe(token: string, body: UpdateMeBody): Promise<MeResponse> {
  const { data } = await client.patch<MeApiResponse | MePayload>("/users", body, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload: MePayload | undefined = (data as MeApiResponse)?.data ?? (data as MePayload);
  if (!payload) throw new Error("빈 응답입니다.");
  return {
    id: payload.id,
    email: payload.email,
    name: payload.name,
    profileImageUrl: payload.avatar ?? payload.profileImageUrl ?? null,
    role: payload.role ?? "USER",
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
    bio: payload.bio ?? null,
  };
}

export default function MyPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const qc = useQueryClient();

  const [editing, setEditing] = useState(false);
  const editRef = useRef<HTMLDivElement | null>(null);
  const openEditor = () => {
    setEditing(true);
    // 약간의 지연 후 스크롤 (레이아웃 렌더링 보장)
    setTimeout(() => {
      editRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["me", token],
    queryFn: () => fetchMe(token),
    enabled: !!token,
    retry: false,
  });

  const [name, setName] = useState("");
  const [bio, setBio] = useState<string>("");
  const [avatar, setAvatar] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pickImage = () => fileInputRef.current?.click();
  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert("이미지 파일은 3MB 이하만 업로드할 수 있어요.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setAvatar(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (data) {
      setName(data.name ?? "");
      setBio(data.bio ?? "");
      setAvatar(data.profileImageUrl ?? "");
    }
  }, [data]);

  const isDirty = useMemo(() => {
    if (!data) return false;
    return (
      name !== (data.name ?? "") || (bio ?? "") !== (data.bio ?? "") || (avatar ?? "") !== (data.profileImageUrl ?? "")
    );
  }, [name, bio, avatar, data]);

  const { mutate: mutateUpdate, isPending } = useMutation({
    mutationFn: (body: UpdateMeBody) => updateMe(token as string, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me", token] });
      alert("프로필이 저장되었습니다.");
      setEditing(false);
    },
    onError: () => {
      alert("저장에 실패했습니다.");
    },
  });

  if (!token) {
    return (
      <div className="p-6 space-y-3">
        <div className="text-red-400">로그인이 필요한 서비스입니다.</div>
        <button
          onClick={() => navigate("/login", { replace: true })}
          className="px-3 py-2 rounded bg-neutral-800 hover:bg-neutral-700"
        >
          로그인 페이지로 이동
        </button>
      </div>
    );
  }

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
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">마이페이지</h1>

      <div className="flex flex-col items-center gap-4 p-6 rounded bg-neutral-900 border border-neutral-800">
        <div className="relative">
          <img
            src={avatar || "/default-profile.png"}
            alt="avatar"
            className="w-28 h-28 rounded-full object-cover border border-neutral-700"
          />
          <button
            type="button"
            onClick={openEditor}
            aria-label="프로필 수정"
            title="프로필 수정"
            className="absolute -right-1 -bottom-0 flex items-center justify-center w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 border border-neutral-600"
          >
            <img src={editIconUrl} alt="edit" className="w-4 h-4" />
          </button>
          <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={onFileChange} />
        </div>
        <div className="text-center space-y-1">
          <p className="text-lg font-semibold">{data.name}</p>
          <p className="text-sm text-neutral-400">{data.email}</p>
          {data.bio ? (
            <p className="text-sm text-neutral-300 mt-2 max-w-md whitespace-pre-wrap">{data.bio}</p>
          ) : (
            <p className="text-sm text-neutral-500 mt-2">자기소개가 없습니다.</p>
          )}
        </div>
        <div className="text-sm text-neutral-400">가입일: {new Date(data.createdAt).toLocaleDateString()}</div>
        <span className="px-3 py-1 rounded-full text-xs bg-neutral-800 border border-neutral-700">{data.role}</span>
      </div>

      <section
        ref={editRef}
        className={`p-6 rounded bg-neutral-900 border border-neutral-800 space-y-4 ${editing ? "block" : "hidden"}`}
      >
        <div className="flex w-full justify-between">
          <h2 className="font-semibold">프로필 수정</h2>
          <button
            onClick={() => setEditing(false)}
            className="px-3 py-2 rounded border border-neutral-700 hover:bg-neutral-800"
            disabled={isPending}
          >
            닫기
          </button>
        </div>

        <div className="flex w-full items-center justify-center">
          <img
            src={avatar || "/default-profile.png"}
            alt="미리보기"
            className="w-28 h-28 rounded-full object-cover border border-neutral-700 cursor-pointer"
            title="이미지를 클릭해 변경"
            role="button"
            tabIndex={0}
            onClick={pickImage}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") pickImage();
            }}
          />
        </div>

        <label className="block text-sm mb-1">이름</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded border border-neutral-700 bg-neutral-800 px-3 py-2 outline-none"
          placeholder="이름"
        />

        <label className="block text-sm mt-4 mb-1">소개</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full rounded border border-neutral-700 bg-neutral-800 px-3 py-2 h-28 resize-none outline-none"
          placeholder="자기소개를 입력하세요"
        />

        {/* <label className="block text-sm mt-4 mb-1">아바타 이미지 URL</label> */}
        {/* <input
          value={avatar}
          onChange={(e) => setAvatar(e.target.value)}
          className="w-full rounded border border-neutral-700 bg-neutral-800 px-3 py-2 outline-none"
          placeholder="https://..."
        /> */}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={() => {
              if (!data) return;
              setName(data.name ?? "");
              setBio(data.bio ?? "");
              setAvatar(data.profileImageUrl ?? "");
            }}
            className="px-3 py-2 rounded border border-neutral-700 hover:bg-neutral-800"
            disabled={isPending}
          >
            초기화
          </button>

          <button
            onClick={() => mutateUpdate({ name: name || undefined, bio: bio ?? null, avatar: avatar || null })}
            className="px-4 py-2 rounded bg-pink-600 hover:bg-pink-500 disabled:opacity-50"
            disabled={!isDirty || isPending}
          >
            {isPending ? "저장 중..." : "저장"}
          </button>
        </div>
      </section>
    </div>
  );
}
//
