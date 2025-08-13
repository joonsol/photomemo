const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();


const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));


app.use(express.json({ limit: "2mb" }));


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB 연결 성공"))
  .catch((err) => console.error("MongoDB 연결 실패:", err.message));

app.get("/", (_req, res) => res.send("PhotoMemo API OK"));
app.use("/api/auth", require("./routes/authRoutes"));

  app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "서버 오류", error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}`);
});
