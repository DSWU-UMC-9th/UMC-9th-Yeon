import { useCustomFetchBasic } from "../hooks/useCustomFetchBasic";

interface WelcomeData {
  id: number;
  name: string;
  email: string;
}

export default function BasicFetchPage() {
  const { data } = useCustomFetchBasic<WelcomeData>("https://jsonplaceholder.typicode.com/users/1");

  return (
    <div>
      <h1>Basic Fetch Example</h1>
      <p>{data?.name}</p>
      <p>{data?.email}</p>
    </div>
  );
}
