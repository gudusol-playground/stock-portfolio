import Link from "next/link";
import { login } from "../actions";
import { AuthForm } from "../components/auth-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 px-4">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">로그인</h1>
          <p className="text-sm text-muted-foreground">주식 포트폴리오에 오신 것을 환영합니다</p>
        </div>
        <AuthForm action={login} submitLabel="로그인" />
        <p className="text-center text-sm text-muted-foreground">
          계정이 없으신가요?{" "}
          <Link href="/auth/signup" className="text-foreground underline underline-offset-4">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
