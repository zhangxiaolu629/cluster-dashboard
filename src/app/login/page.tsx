import { Suspense } from "react";
import LoginForm from "./LoginForm";

function LoginFallback() {
  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
      <p style={{ color: "#8c8c8c" }}>加载中…</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
