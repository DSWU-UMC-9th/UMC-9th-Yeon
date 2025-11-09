export default function LpCreate() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">새 LP 만들기</h1>

      <form className="flex flex-col gap-3">
        <input placeholder="제목" className="outline-none px-3 py-2 rounded bg-neutral-800 border border-neutral-600" />
        <textarea
          placeholder="설명"
          className="outline-none resize-none px-3 py-2 h-32 rounded bg-neutral-800 border border-neutral-600"
        />
        <button className="px-3 py-2 rounded bg-pink-600">생성</button>
      </form>
    </div>
  );
}
