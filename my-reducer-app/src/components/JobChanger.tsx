import { useReducer, useState } from "react";

interface State {
  job: string;
  error: string | null;
}

interface Action {
  type: "CHANGE_JOB" | "RESET";
  payload?: string;
}

const initialState: State = {
  job: "Software Developer",
  error: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "CHANGE_JOB": {
      const newJob = action.payload ?? "";
      const isInvalid = newJob.trim().length < 1;

      return {
        ...state,
        job: isInvalid ? state.job : newJob,
        error: isInvalid ? "직무는 최소 1글자 이상이어야 합니다." : null,
      };
    }

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

export default function JobChanger() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [inputValue, setInputValue] = useState("");

  const applyChange = () => {
    dispatch({ type: "CHANGE_JOB", payload: inputValue });
  };

  return (
    <div className="w-full h-screen bg-[#1A1A1A] flex flex-col items-center justify-center text-white gap-8">
      <h1 className="text-4xl font-semibold">{state.job}</h1>

      <div className="flex gap-2 w-[600px]">
        <input
          type="text"
          placeholder="변경하시고 싶은 직무를 입력해주세요. 단 1글자 이상 가능"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="w-full flex-1 px-4 py-2 rounded-md bg-[#0E0E0E] text-white border border-gray-600 placeholder-gray-400"
        />

        <button
          onClick={applyChange}
          className="px-4 py-2 rounded-md bg-[#0E0E0E] border border-gray-600 hover:bg-gray-700 transition"
        >
          직무 변경하기
        </button>
      </div>

      {state.error && (
        <p className="text-red-400 text-sm">{state.error}</p>
      )}
    </div>
  );
}