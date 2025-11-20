import { useCustomFetchPendingError } from "../hooks/useCustomFetchPendingError";

interface WelcomeData {
  id: number;
  name: string;
  email: string;
}

export default function PendingErrorPage() {
  const { data, isPending, isError } = useCustomFetchPendingError<WelcomeData>(
    "https://jsonplaceholder.typicode.com/users/1"
  );

  if (isPending) return <div>Loading...</div>;
  if (isError) return <div>Error Occurred</div>;

  return (
    <div>
      <h1>{data?.name}</h1>
      <p>{data?.email}</p>
    </div>
  );
}
