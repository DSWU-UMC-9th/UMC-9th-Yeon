type Props = {
  page: number;
  setPage: (n: number) => void;
  isLoading?: boolean;
};
export default function Pager({ page, setPage, isLoading }: Props) {
  return (
    <div className="flex items-center justify-center gap-4 mb-6">
      <button
        onClick={() => setPage(Math.max(1, page - 1))}
        disabled={page === 1 || isLoading}
        className="rounded px-5 py-2 bg-purple-400 text-white hover:bg-green-400 disabled:bg-gray-400 disabled:text-white"
      >
        {"<"}
      </button>
      <span className="text-sm text-gray-700">{page} 페이지</span>
      <button
        onClick={() => setPage(page + 1)}
        disabled={isLoading}
        className="rounded px-5 py-2 bg-purple-400 text-white hover:bg-green-400 disabled:bg-gray-400 disabled:text-white"
      >
        {">"}
      </button>
    </div>
  );
}
