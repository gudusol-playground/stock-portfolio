import Link from "next/link";
import { signup } from "../actions";
import { AuthForm } from "../components/auth-form";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 px-4">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">회원가입</h1>
          <p className="text-sm text-muted-foreground">새 계정을 만들어 포트폴리오를 관리하세요</p>
        </div>
        <AuthForm action={signup} submitLabel="회원가입" />
        <p className="text-center text-sm text-muted-foreground">
          이미 계정이 있으신가요?{" "}
          <Link href="/auth/login" className="text-foreground underline underline-offset-4">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
