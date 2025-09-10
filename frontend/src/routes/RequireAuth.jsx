// src/routes/RequireAuth.jsx
import { Navigate, Outlet } from "react-router-dom";

/** 간단한 인증 가드 */
export default function RequireAuth({ isAuthed }) {
  if (!isAuthed) {
    // 비로그인 → 공개 페이지로
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
