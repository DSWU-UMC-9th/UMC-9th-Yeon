import { useNavigate } from "react-router-dom";
import Button from "../components/forms/Button";
import TextInput from "../components/forms/TextInput";
import { useState } from "react";
import googleLogo from "../media/google.svg";
import backLogo from "../media/back.svg";

const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export default function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // 전체 값 보관
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);

  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const [confirm, setConfirm] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);

  const [nickname, setNickname] = useState("");
  const [nicknameTouched, setNicknameTouched] = useState(false);

  // 유효성
  const emailError = emailTouched && !emailRegex.test(email) ? "올바른 이메일 형식을 입력해주세요." : undefined;

  const pwError = passwordTouched && password.length < 8 ? "비밀번호는 8자 이상이어야 합니다." : undefined;

  const confirmError = confirmTouched && confirm !== password ? "비밀번호가 일치하지 않습니다." : undefined;

  const nicknameError = nicknameTouched && nickname.trim().length === 0 ? "닉네임을 입력해주세요." : undefined;

  const canNextFromEmail = emailRegex.test(email);
  const canNextFromPassword = password.length >= 8 && confirm === password && confirm.length > 0;
  const canComplete = nickname.trim().length > 0;

  const goPrev = () => {
    if (step === 1) {
      navigate(-1);
    } else {
      setStep((s) => (s - 1) as 1 | 2 | 3);
    }
  };

  const handleComplete = async () => {
    // TODO: 실제 API 연동 위치 (회원가입)
    // await api.auth.signup({ email, password, nickname });
    console.log("signup:", { email, password, nickname });
    navigate("/"); // 완료 후 홈으로
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
        {/* 상단 */}
        <div className="flex items-center">
          <button
            onClick={goPrev}
            className="mb-2 w-fit rounded-md px-2 py-1 text-sm text-gray-300 hover:bg-gray-800"
            aria-label="이전 페이지로 이동"
          >
            <img src={backLogo} alt="back" className="mr-2 h-5 w-5" />
          </button>
          <h1 className="mx-auto text-xl font-semibold">회원가입</h1>
          <div className="w-5" /> {/* 균형용 빈칸 */}
        </div>

        {/* STEP 1: 이메일 */}
        {step === 1 && (
          <>
            <Button
              onClick={() => console.log("google signup")}
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

            <TextInput
              name="email"
              type="email"
              placeholder="이메일을 입력해주세요!"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
              error={emailError}
              aria-invalid={!!emailError}
            />

            <Button disabled={!canNextFromEmail} onClick={() => setStep(2)} className="mt-2">
              다음
            </Button>
          </>
        )}

        {/* STEP 2: 비밀번호 + 확인 */}
        {step === 2 && (
          <>
            <div className="flex items-center text-sm text-gray-300">
              <span className="mr-2">✉</span>
              {email}
            </div>

            <div className="relative">
              <TextInput
                name="password"
                type={showPw ? "text" : "password"}
                placeholder="비밀번호를 입력해주세요!"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setPasswordTouched(true)}
                error={pwError}
                aria-invalid={!!pwError}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-200"
                aria-label="비밀번호 보기/숨기기"
              >
                {showPw ? "🙈" : "👁️"}
              </button>
            </div>

            <div className="relative">
              <TextInput
                name="confirm"
                type={showConfirm ? "text" : "password"}
                placeholder="비밀번호를 다시 한 번 입력해주세요!"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onBlur={() => setConfirmTouched(true)}
                error={confirmError}
                aria-invalid={!!confirmError}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-200"
                aria-label="비밀번호 확인 보기/숨기기"
              >
                {showConfirm ? "🙈" : "👁️"}
              </button>
            </div>

            <Button disabled={!canNextFromPassword} onClick={() => setStep(3)} className="mt-2">
              다음
            </Button>
          </>
        )}

        {/* STEP 3: 닉네임 */}
        {step === 3 && (
          <>
            {/* 프로필 이미지 UI (더미) */}
            <div className="mx-auto mb-2 mt-2 h-28 w-28 rounded-full bg-gray-600/50" />

            <TextInput
              name="nickname"
              type="text"
              placeholder="닉네임을 입력해주세요!"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onBlur={() => setNicknameTouched(true)}
              error={nicknameError}
              aria-invalid={!!nicknameError}
            />

            <Button disabled={!canComplete} onClick={handleComplete} className="mt-2">
              회원가입 완료
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
