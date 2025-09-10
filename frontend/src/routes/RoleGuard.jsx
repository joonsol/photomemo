// src/routes/RoleGuard.jsx
import { Navigate, Outlet } from "react-router-dom";

export default function RoleGuard({ user, allow = [] }) {
  // ✅ 비로그인 사용자는 페이지에 접근하게 두고(모달 열 수 있게),
  //    로그인 후 admin이 아니면 홈으로 보냄
  if (!user) return <Outlet />;

  const role = user.role || "user";
  return allow.includes(role) ? <Outlet /> : <Navigate to="/home" replace />;
}
