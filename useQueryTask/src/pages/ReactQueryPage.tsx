import { useCustomFetchReactQuery } from "../hooks/useCustomFetchReactQuery";

interface WelcomeData {
  id: number;
  name: string;
  email: string;
}

export default function ReactQueryPage() {
  const { data, isPending, isError } = useCustomFetchReactQuery<WelcomeData>(
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
