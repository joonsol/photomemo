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

router.post("/login", async (req, res) => {
  try {
    const { email = "", password = "" } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase(),
      isActive: true,
    });

    const invalidMsg = { message: "이메일 또는 비밀번호가 올바르지 않습니다." };
    if (!user) return res.status(400).json(invalidMsg);

    const ok = await user.comparePassword(password);
    if (!ok) {
      user.loginAttempts += 1

      if (user.loginAttempts >= 5) {
        user.isActive = false
      }

      await user.save()
      return res.status(400).json({
        invalidMsg,
        message: `남은 횟수 : ${5 - user.loginAttempts}번`
      });
    }


    user.loginAttempts = 0
    user.isLoggined = true;
    user.lastLoginAt = new Date()

    await user.save()


    const token = makeToken(user);

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      user: user.toSafeJSON(),
      token, // 쿠키를 쓰면 이 줄은 제거해도 됨
    });
  } catch (err) {
    return res.status(500).json({ message: "로그인 실패", error: err.message });
  }
})


router.get("/me", async (req, res) => {
  try {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : null;
    if (!token) return res.status(401).json({ message: "인증 필요" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) return res.status(404).json({ message: "사용자 없음" });
    // 안전한 JSON 응답 (비밀번호 등 민감한 정보 제외)
    res.status(200).json(user.toSafeJSON());
  } catch (error) {
    res.status(401).json({ message: "토큰 무효", error: err.message });
  }
})


router.get("/users", async (req, res) => {
  try {
    const h = req.headers.authorization || "";

    const token = h.startsWith("Bearer ") ? h.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: "인증 필요" });
    }

    // 토큰 검증
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // 유저 정보 가져오기
    const me = await User.findById(payload.id);
    if (!me) {
      return res.status(404).json({ message: "사용자 없음" });
    }

    // 권한 체크 (admin만 허용)
    if (me.role !== "admin") {
      return res.status(403).json({ message: "권한 없음" });
    }
    // 전체 사용자 목록 가져오기
    const users = await User.find().select("-passwordHash"); // 비밀번호 제외
    return res.status(200).json({ users });

  } catch (error) {
    return res.status(401).json({ message: "토큰 무효", error: err.message });
  }

})


router.post("/logout", async (req, res) => {
  try {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : null;

    if (!token) {
      return res.status(400).json({ message: "로그인 상태가 아닙니다." });
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByIdAndUpdate(
      payload.id,
      { $set: { isLoggined: false } },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: "사용자 없음" });
    }

    // 쿠키 삭제
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "lax",
      secure: "production",
    });
    return res.status(200).json({ message: "로그아웃 성공" });
  } catch (error) {
    return res.status(500).json({ message: "로그아웃 실패", error: err.message });
  }
})
module.exports = router;