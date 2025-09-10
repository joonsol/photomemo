import { Navigate, Outlet } from "react-router-dom";

export default function RoleGuard({ user, allow = [] }) {
  // 로그인 안 된 경우
  if (!user) return <Navigate to="/" replace />;

  // role 값이 없을 때도 대비
  const role = user.role || "user";

  // 허용된 역할이면 통과, 아니면 홈으로
  return allow.includes(role) ? <Outlet /> : <Navigate to="/home" replace />;
}
