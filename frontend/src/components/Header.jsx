import { Link } from "react-router-dom";

function Header() {
  return (
    <header style={{ padding: "1rem", borderBottom: "1px solid #ccc" }}>
      <Link to="/">홈</Link> |{" "}
      <Link to="/write">글쓰기</Link> |{" "}
      <Link to="/login">로그인</Link> |{" "}
      <Link to="/register">회원가입</Link> |{" "}
      <Link to="/mypage">마이페이지</Link>
    </header>
  );
}

export default Header;
