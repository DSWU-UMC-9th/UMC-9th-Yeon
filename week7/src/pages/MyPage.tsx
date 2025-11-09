import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../api/client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import editIconUrl from "../assets/edit.svg";
import { useNavigate, Link } from "react-router-dom";
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

interface LpAuthor {
  id: number;
  name: string;
}

interface LpSummary {
  id: number;
  title: string;
  thumbnail: string | null;
  createdAt: string;
  author: LpAuthor;
  likeCount?: number;
}

interface ListResp<T> {
  status?: boolean;
  statusCode?: number;
  message?: string;
  data?: { items?: T[]; cursor?: number | null } | T[];
}

// 응답 포맷이 케이스마다 달라지는 것을 흡수하는 유틸
function pluckItems(body: any): any[] {
  const b = body ?? {};
  // 1) 최상위가 배열
  if (Array.isArray(b)) return b;
  // 2) data 가 배열
  if (Array.isArray(b.data)) return b.data;
  // 3) data.items / items
  if (Array.isArray(b.data?.items)) return b.data.items;
  if (Array.isArray(b.items)) return b.items;
  // 4) data.rows
  if (Array.isArray(b.data?.rows)) return b.data.rows;
  // 5) data.data (중첩 data)
  if (Array.isArray(b.data?.data)) return b.data.data;
  // 6) 혹시 다른 키(list 등)
  if (Array.isArray(b.list)) return b.list;
  if (Array.isArray(b.data?.list)) return b.data.list;
  return [];
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

interface UploadImageApiResponse {
  status?: boolean;
  message?: string;
  data?: { imageUrl?: string };
  imageUrl?: string;
}
async function uploadImage(token: string, file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const { data } = await client.post<UploadImageApiResponse>("/uploads", fd, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
  });
  const url = data?.data?.imageUrl ?? data?.imageUrl;
  if (!url) throw new Error("이미지 업로드 응답에 imageUrl이 없습니다.");
  return url;
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

async function fetchLikedLps(token: string, order: "asc" | "desc" = "desc"): Promise<LpSummary[]> {
  const { data } = await client.get<ListResp<LpSummary>>("/lps/likes/me", {
    headers: { Authorization: `Bearer ${token}` },
    params: { limit: 20, order },
  });
  // DEBUG: print raw
  console.log("[MY PAGE] raw response", data);
  // 다양한 응답 포맷 방어적 처리
  const payload = pluckItems(data);
  console.log("[MY PAGE] liked payload keys:", Object.keys((data as any) ?? {}));
  console.log("[MY PAGE] liked parsed list length =", payload.length, payload);
  const list: any[] = payload;
  return list.map((it) => ({
    id: it.id,
    title: it.title,
    thumbnail: it.thumbnail ?? null,
    createdAt: it.createdAt ?? it.created_at ?? it.updatedAt ?? new Date().toISOString(),
    author: it.author ?? { id: it.authorId, name: it.authorName },
    likeCount: it.likes ? it.likes.length : it.likeCount,
  }));
}

async function fetchMyLps(token: string, order: "asc" | "desc" = "desc"): Promise<LpSummary[]> {
  const { data } = await client.get<ListResp<LpSummary>>("/lps/user", {
    headers: { Authorization: `Bearer ${token}` },
    params: { limit: 20, order },
  });
  // DEBUG: print raw
  console.log("[MY PAGE] raw response", data);
  // 다양한 응답 포맷 방어적 처리
  const payload = pluckItems(data);
  console.log("[MY PAGE] mine payload keys:", Object.keys((data as any) ?? {}));
  console.log("[MY PAGE] mine parsed list length =", payload.length, payload);
  const list: any[] = payload;
  return list.map((it) => ({
    id: it.id,
    title: it.title,
    thumbnail: it.thumbnail ?? null,
    createdAt: it.createdAt ?? it.created_at ?? it.updatedAt ?? new Date().toISOString(),
    author: it.author ?? { id: it.authorId, name: it.authorName },
    likeCount: it.likes ? it.likes.length : it.likeCount,
  }));
}

export default function MyPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const qc = useQueryClient();

  const [tab, setTab] = useState<"liked" | "mine">("liked");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

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
  useEffect(() => {
    if (data) {
      console.log("[MY PAGE] /users/me payload:", data);
    }
  }, [data]);

  const [name, setName] = useState("");
  const [bio, setBio] = useState<string>("");
  const [avatar, setAvatar] = useState<string>("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

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
    setAvatarFile(file);
    const previewUrl = URL.createObjectURL(file);
    setAvatar(previewUrl);
  };

  useEffect(() => {
    if (data) {
      setName(data.name ?? "");
      setBio(data.bio ?? "");
      setAvatar(data.profileImageUrl ?? "");
      setAvatarFile(null);
    }
  }, [data]);

  const { data: likedList, isLoading: likedLoading } = useQuery({
    queryKey: ["lps", "liked", { token, order }],
    queryFn: () => fetchLikedLps(token as string, order),
    enabled: !!token,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: "always",
  });
  useEffect(() => {
    if (likedList) {
      console.log("[MY PAGE] likedList items:", likedList);
    }
  }, [likedList]);

  const { data: myList, isLoading: myLoading } = useQuery({
    queryKey: ["lps", "mine", { token, order }],
    queryFn: () => fetchMyLps(token as string, order),
    enabled: !!token,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: "always",
  });
  useEffect(() => {
    if (myList) {
      console.log("[MY PAGE] myList items:", myList);
    }
  }, [myList]);

  // 페이지가 다시 보이거나(탭 전환/복귀), 다른 화면에서 LP 생성·수정 후 커스텀 이벤트가 발생하면 최신화
  useEffect(() => {
    const refresh = () => {
      if (!token) return;
      qc.invalidateQueries({ queryKey: ["lps", "liked"] });
      qc.invalidateQueries({ queryKey: ["lps", "mine"] });
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };

    window.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("lp:mutated", refresh); // 예: 생성/수정 화면에서 dispatchEvent(new Event("lp:mutated"))

    return () => {
      window.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("lp:mutated", refresh);
    };
  }, [qc, token]);

  // 현재 탭 기준으로 리스트/로딩만 보도록 분리
  const currentList = useMemo(() => (tab === "liked" ? likedList ?? [] : myList ?? []), [tab, likedList, myList]);
  const currentLoading = tab === "liked" ? likedLoading : myLoading;
  useEffect(() => {
    console.log("[MY PAGE] tab:", tab, "| order:", order, "| currentLoading:", currentLoading);
    console.log("[MY PAGE] currentList length:", currentList.length, currentList);
  }, [tab, order, currentLoading, currentList]);

  const isDirty = useMemo(() => {
    if (!data) return false;
    const baseName = data.name ?? "";
    const baseBio = data.bio ?? "";
    const baseAvatar = data.profileImageUrl ?? "";
    return name !== baseName || (bio ?? "") !== baseBio || !!avatarFile || (avatar ?? "") !== baseAvatar;
  }, [name, bio, avatar, avatarFile, data]);

  const { mutate: mutateUpdate, isPending } = useMutation({
    // 서버 반영
    mutationFn: async (body: UpdateMeBody) => {
      let avatarUrl: string | null | undefined = body.avatar;
      // 실제 업로드는 서버 반영 시 수행
      if (avatarFile) {
        avatarUrl = await uploadImage(token as string, avatarFile);
      }
      return updateMe(token as string, { ...body, avatar: avatarUrl ?? null });
    },

    // ✅ 낙관적 업데이트: 서버 응답 전에 NavBar/마이페이지의 내 정보 즉시 갱신
    onMutate: async (body: UpdateMeBody) => {
      // 진행 중인 동일 쿼리 취소
      await qc.cancelQueries({ queryKey: ["me", token] });

      // 기존 데이터 스냅샷 (롤백용)
      const previous = qc.getQueryData<MeResponse>(["me", token]);

      // 화면에 즉시 보여줄 낙관적 데이터 구성
      const optimistic: MeResponse | undefined = previous
        ? {
            ...previous,
            name: body.name ?? previous.name,
            bio: (body.bio ?? previous.bio) as any,
            // 파일을 선택했다면 현재 미리보기(avatar state)를 즉시 반영
            profileImageUrl: avatarFile
              ? avatar || previous.profileImageUrl || null
              : body.avatar ?? previous.profileImageUrl ?? null,
            updatedAt: new Date().toISOString(),
          }
        : undefined;

      if (optimistic) {
        qc.setQueryData(["me", token], optimistic);
      }

      // 롤백을 위해 스냅샷 반환
      return { previous };
    },

    // 실패 시 롤백
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(["me", token], context.previous);
      }
      alert("저장에 실패했습니다.");
    },

    // 성공/실패 관계없이 마지막에 서버 소스로 동기화
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["me", token] });
    },

    // 성공시 후처리 (모달 닫기 등)
    onSuccess: () => {
      alert("프로필이 저장되었습니다.");
      setAvatarFile(null);
      setEditing(false);
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
    <div className=" max-w-2xl mx-auto p-6 space-y-6 ">
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

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={() => {
              if (!data) return;
              setName(data.name ?? "");
              setBio(data.bio ?? "");
              setAvatar(data.profileImageUrl ?? "");
              setAvatarFile(null);
            }}
            className="px-3 py-2 rounded border border-neutral-700 hover:bg-neutral-800"
            disabled={isPending}
          >
            초기화
          </button>

          <button
            onClick={() =>
              mutateUpdate({
                name: name || undefined,
                bio: bio ?? null,
                // Keep current avatar URL only when 새 이미지가 없는 경우
                avatar: avatarFile ? undefined : avatar || null,
              })
            }
            className="px-4 py-2 rounded bg-pink-600 hover:bg-pink-500 disabled:opacity-50"
            disabled={!isDirty || isPending}
          >
            {isPending ? "저장 중..." : "저장"}
          </button>
        </div>
      </section>

      <div className="mt-6">
        {/* 탭 */}
        <div className="flex items-center gap-6 border-b border-neutral-800 mb-4">
          <button
            className={`py-2 -mb-px border-b-2 ${
              tab === "liked" ? "border-pink-500 text-white" : "border-transparent text-neutral-400"
            }`}
            onClick={() => setTab("liked")}
          >
            내가 좋아요 한 LP
          </button>
          <button
            className={`py-2 -mb-px border-b-2 ${
              tab === "mine" ? "border-pink-500 text-white" : "border-transparent text-neutral-400"
            }`}
            onClick={() => setTab("mine")}
          >
            내가 작성한 LP
          </button>

          <div className="ml-auto inline-flex rounded-md border border-neutral-700 overflow-hidden">
            <button
              className={`px-3 py-1 text-sm ${
                order === "asc" ? "text-neutral-800 bg-neutral-100" : "text-neutral-300 hover:bg-neutral-800/50"
              }`}
              onClick={() => setOrder("asc")}
            >
              오래된순
            </button>
            <button
              className={`px-3 py-1 text-sm border-l border-neutral-700 ${
                order === "desc" ? "text-neutral-800 bg-neutral-100" : "text-neutral-300 hover:bg-neutral-800/50"
              }`}
              onClick={() => setOrder("desc")}
            >
              최신순
            </button>
          </div>
        </div>

        {/* 리스트 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {currentList.map((lp) => (
            <Link to={`/lps/${lp.id}`} key={`${tab}-${lp.id}`} className="block group">
              <div className="aspect-square w-full overflow-hidden rounded border border-neutral-800 bg-neutral-900">
                {lp.thumbnail ? (
                  <img
                    src={lp.thumbnail}
                    alt={lp.title}
                    className="w-full h-full object-cover group-hover:opacity-90"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-500">이미지 없음</div>
                )}
              </div>
              <div className="mt-2 text-sm truncate text-neutral-200">{lp.title}</div>
              <div className="text-xs text-neutral-500">{new Date(lp.createdAt).toLocaleDateString()}</div>
            </Link>
          ))}

          {currentLoading && <div className="col-span-full text-neutral-400">불러오는 중…</div>}

          {!currentLoading && currentList.length === 0 && (
            <div className="col-span-full text-neutral-500">표시할 항목이 없습니다.</div>
          )}
        </div>
      </div>
    </div>
  );
}
//
