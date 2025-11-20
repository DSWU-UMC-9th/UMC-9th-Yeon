import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import PlusIcon from "../../assets/plus.svg";
import LpDisc from "../../assets/lp.png";
import api from "../../api/client";

// If your project is missing React type declarations (e.g. @types/react),
// TypeScript can complain that 'JSX.IntrinsicElements' does not exist.
// Provide a minimal fallback here so this file's TSX compiles even when
// the global React types are not available.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

export default function Fab() {
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const qc = useQueryClient();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const handlePick = () => fileRef.current?.click();

  const handleFile: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const addTag = () => {
    const v = tagInput.trim();
    if (!v) return;
    if (tags.includes(v)) return;
    setTags((prev) => [...prev, v]);
    setTagInput("");
  };

  const removeTag = (t: string) => setTags((prev) => prev.filter((x) => x !== t));

  const resetForm = () => {
    setPreview(null);
    setFile(null);
    setTitle("");
    setContent("");
    setTagInput("");
    setTags([]);
  };

  const createLp = useMutation({
    mutationFn: async () => {
      // 1) 선택된 파일이 있으면 먼저 업로드하여 이미지 URL을 받음
      let thumbnailUrl = "";
      if (file) {
        const form = new FormData();
        form.append("file", file);
        const { data: uploadRes } = await api.post("/uploads", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        // Swagger 예시 기준으로 이미지 경로는 data.imageUrl 필드에 옴
        thumbnailUrl = uploadRes?.data?.imageUrl ?? "";
      }

      // 2) 업로드 결과를 포함해 LP 생성(JSON)
      const payload = {
        title,
        content,
        thumbnail: thumbnailUrl,
        tags,
        published: true,
      } as const;

      const { data } = await api.post("/lps", payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lps"] });
      setOpen(false);
      resetForm();
    },
  });

  const submitDisabled = createLp.isPending || !title.trim();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-30 h-12 w-12 rounded-full bg-pink-600 hover:bg-pink-500 flex items-center justify-center text-2xl shadow-lg"
        aria-label="create"
      >
        <img src={PlusIcon} alt="create" className="w-5 h-5" />
      </button>

      {open && (
        <div aria-modal role="dialog" className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />

          <div
            className="relative z-10 w-[min(90vw,520px)] rounded-xl bg-neutral-900 text-white shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">새 LP 작성</h2>
              <button
                className="inline-flex h-8 w-8 items-center justify-center rounded"
                aria-label="close"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col items-center gap-3">
                {/* 업로드 전: 원형 LP만 노출 / 업로드 후: 정사각형 미리보기 + 원형 LP 나란히 */}
                {preview ? (
                  <div className="relative flex items-center gap-4">
                    {/* 선택된 이미지 미리보기 (정사각형) */}
                    <label
                      htmlFor="lp-file"
                      className="absolute right-20 h-48 w-48 overflow-hidden rounded-md bg-neutral-800 z-50"
                      aria-label="이미지 다시 선택"
                      title="다른 이미지를 선택하려면 클릭"
                    >
                      <img src={preview} alt="선택한 이미지 미리보기" className="h-full w-full object-cover" />
                    </label>

                    {/* 장식용 LP 디스크 (비활성) */}
                    <div className="h-48 w-48 overflow-hidden rounded-full opacity-80 pointer-events-none">
                      <img src={LpDisc} alt="LP" className="h-full w-full object-contain" />
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handlePick}
                    className="relative h-48 w-48 overflow-hidden rounded-full bg-neutral-800 "
                    aria-label="이미지 선택"
                    title="LP 이미지를 업로드하려면 클릭"
                  >
                    <img src={LpDisc} alt="LP 기본 이미지" className="h-full w-full object-contain" />
                  </button>
                )}

                <input
                  id="lp-file"
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFile}
                />
              </div>

              <label className="text-sm">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="LP Name"
                  className="w-full rounded-md border border-white/10 bg-neutral-800 px-3 py-2 outline-none focus:border-pink-500"
                />
              </label>

              <label className="text-sm">
                <input
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="LP Content"
                  className="w-full rounded-md border border-white/10 bg-neutral-800 px-3 py-2 outline-none focus:border-pink-500"
                />
              </label>

              <div className="text-sm">
                <div className="flex gap-2">
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="LP Tag"
                    className="flex-1 rounded-md border border-white/10 bg-neutral-800 px-3 py-2 outline-none focus:border-pink-500"
                  />
                  <button
                    type="button"
                    className={`rounded-md px-3 py-2 ${
                      tagInput.trim() ? "bg-pink-600 hover:bg-pink-500" : "bg-neutral-700 hover:bg-neutral-600"
                    }`}
                    onClick={addTag}
                  >
                    Add
                  </button>
                </div>
                {!!tags.length && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 rounded-full bg-neutral-800 px-2 py-1 text-s"
                      >
                        #{t}
                        <button
                          className="ml-1 rounded-full px-1"
                          aria-label={`remove ${t}`}
                          onClick={() => removeTag(t)}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  disabled={submitDisabled}
                  className="w-full rounded-md bg-pink-600 px-4 py-2 text-sm font-semibold hover:bg-pink-500 disabled:opacity-50"
                  onClick={() => createLp.mutate()}
                >
                  {createLp.isPending ? "생성 중…" : "Add LP"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
