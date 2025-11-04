import { useNavigate } from "react-router-dom";
import Button from "../components/forms/Button";
import TextInput from "../components/forms/TextInput";
import { useForm } from "../hooks/useForm";
import googleLogo from "../media/google.svg";
import backLogo from "../media/back.svg";

type LoginValues = {
  email: string;
  password: string;
};

const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export default function Login() {
  const navigate = useNavigate();

  const { values, errors, touched, isValid, submitting, handleChange, handleBlur, handleSubmit } = useForm<LoginValues>(
    {
      initialValues: { email: "", password: "" },
      validate: (v) => {
        const errs: Partial<Record<keyof LoginValues, string>> = {};
        if (!emailRegex.test(v.email)) {
          errs.email = "올바른 이메일 형식을 입력해주세요.";
        }
        if (v.password.length < 6) {
          errs.password = "비밀번호는 최소 6자 이상이어야 합니다.";
        }
        return errs;
      },
      onSubmit: async ({ email, password }) => {
        // TODO: 실제 로그인 API 연동 위치
        // await api.auth.login({ email, password });
        console.log("login with", email, password);
        // 성공 시 이동
        // navigate("/");
      },
    }
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
        {/* 뒤로가기 */}
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="mb-2 w-fit rounded-md px-2 py-1 text-sm text-gray-300 hover:bg-gray-800"
            aria-label="이전 페이지로 이동"
          >
            <img src={backLogo} alt="back" className="mr-2 h-5 w-5" />
          </button>

          <h1 className="ml-17 text-center text-xl font-semibold">로그인</h1>
        </div>

        {/* 구글 로그인 */}
        <Button
          onClick={() => console.log("google login")}
          className="border border-gray-700 bg-transparent text-gray-200 hover:bg-gray-800 flex items-center justify-center"
        >
          <img src={googleLogo} alt="Google" className="mr-2 h-5 w-5" />
          구글 로그인
        </Button>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-700" />
          <span className="text-xs text-gray-400">OR</span>
          <div className="h-px flex-1 bg-gray-700" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextInput
            name="email"
            type="email"
            placeholder="이메일을 입력해주세요!"
            value={values.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.email ? errors.email : undefined}
            aria-invalid={!!(touched.email && errors.email)}
            aria-describedby="email-error"
          />
          <TextInput
            name="password"
            type="password"
            placeholder="비밀번호를 입력해주세요!"
            value={values.password}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.password ? errors.password : undefined}
            aria-invalid={!!(touched.password && errors.password)}
            aria-describedby="password-error"
          />

          {/* 로그인 버튼: 이메일 + 비번 모두 유효할 때만 활성화 */}
          <Button type="submit" loading={submitting} disabled={!isValid} className="mt-2">
            로그인
          </Button>
        </form>
      </div>
    </div>
  );
}
