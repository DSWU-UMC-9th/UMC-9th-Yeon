import { useState } from "react";
import { useCustomFetchAdvanced } from "../hooks/useCustomFetchAdvanced";

interface WelcomeData {
  id: number;
  name: string;
  email: string;
}

export default function AdvancedFetchPage() {
  const [userId, setUserId] = useState(1);

  const randomId = () => {
    setUserId(Math.floor(Math.random() * 10) + 1);
  };

  const { data, isPending, isError } = useCustomFetchAdvanced<WelcomeData>(
    `https://jsonplaceholder.typicode.com/users/${userId}`
  );

  return (
    <div>
      <button onClick={randomId}>다른 사용자 불러오기</button>

      {isPending && <p>Loading... (User ID: {userId})</p>}
      {isError && <p>Error Occurred</p>}

      {!isPending && !isError && (
        <div>
          <h1>{data?.name}</h1>
          <p>{data?.email}</p>
        </div>
      )}
    </div>
  );
}
