import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CreatePost from "./pages/CreatePost";
import PostDetail from "./pages/PostDetail";
import MyPage from "./pages/MyPage";
import Header from "./components/Header";

import './App.css'

function App() {

  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/write" element={<CreatePost />} />
        <Route path="/post/:id" element={<PostDetail />} />
        <Route path="/mypage" element={<MyPage />} />
      </Routes>
    </>
  )
}

export default App
