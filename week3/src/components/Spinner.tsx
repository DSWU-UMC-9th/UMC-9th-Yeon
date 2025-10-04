export default function Spinner() {
  return (
    <div className="w-full flex justify-center py-10">
      <div className="h-8 w-8 rounded-full border-4 border-green-300 border-t-transparent animate-spin" />
    </div>
  );
}
