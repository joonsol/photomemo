const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User");

// JWT 생성기
function makeToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || "7d" }
  );
}



// routes/auth.js (회원가입 부분)
router.post("/register", async (req, res) => {
  try {
    const { email, password, displayName, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "이메일/비밀번호 필요" });
    }

    // 이미 존재하는 이메일인지 확인
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ message: "이미 가입된 이메일" });

    // 비밀번호 해시
    const passwordHash = await bcrypt.hash(password, 10);

    // role 값이 유효한지 확인 (user / admin 둘 중 하나만 허용)
    const validRoles = ["user", "admin"];
    const safeRole = validRoles.includes(role) ? role : "user";

    // 새 유저 생성
    const user = await User.create({
      email,
      displayName,
      passwordHash,
      role: safeRole,
    });

    res.status(201).json({ user: user.toSafeJSON() });
  } catch (err) {
    res.status(500).json({ message: "회원가입 실패", error: err.message });
  }
});


// 로그인
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase(), isActive: true });
    if (!user) return res.status(400).json({ message: "이메일 또는 비밀번호가 올바르지 않습니다." });

    const ok = await user.comparePassword(password || "");
    if (!ok) return res.status(400).json({ message: "이메일 또는 비밀번호가 올바르지 않습니다." });

    res.status(200).json({ user: user.toSafeJSON(), token: makeToken(user) });
  } catch (err) {
    res.status(500).json({ message: "로그인 실패", error: err.message });
  }
});

// 내 정보 (Bearer 토큰 확인)
router.get("/me", async (req, res) => {
  try {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : null;
    if (!token) return res.status(401).json({ message: "인증 필요" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) return res.status(404).json({ message: "사용자 없음" });

    res.status(200).json(user.toSafeJSON());
  } catch (err) {
    res.status(401).json({ message: "토큰 무효", error: err.message });
  }
});

module.exports = router;
