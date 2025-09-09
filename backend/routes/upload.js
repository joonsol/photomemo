// routes/upload.js
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const router = require("express").Router();
const auth = require("../middlewares/auth"); // ✅ 헤더/쿠키 모두 지원

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // ✅ 변수명 통일
  },
});

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const fileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

// ❌ verifyToken 제거(쿠키 강제 의존으로 500 유발)

router.post("/image", auth, imageUpload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "image 파일이 없습니다." });

    const { originalname, mimetype, buffer } = req.file;
    const ext = path.extname(originalname) || ".bin";
    const fileName = `${uuidv4()}${ext}`;

    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `post-images/${fileName}`,
      Body: buffer,
      ContentType: mimetype,
      // ACL: "public-read", // <- 버킷이 퍼블릭이 아니면 주석 해제
      // CacheControl: "public, max-age=31536000",
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/post-images/${fileName}`;
    res.json({ imageUrl });
  } catch (error) {
    console.error("S3 upload error(image):", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

router.post("/file", auth, fileUpload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "file 이 없습니다." });

    const { originalname, mimetype, buffer } = req.file;
    // 클라이언트에서 보낸 표시용 이름(선택)
    const requestedName = req.body.originalName;
    // S3 Key에 쓸 안전한 파일명
    const safeName = (requestedName || originalname).replace(/[\/\\]+/g, "_");

    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `post-files/${safeName}`,
      Body: buffer,
      ContentType: mimetype,
      ContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(safeName)}`,
      // ACL: "public-read",
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/post-files/${encodeURIComponent(safeName)}`;
    res.json({ fileUrl, originalName: safeName });
  } catch (error) {
    console.error("S3 upload error(file):", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

module.exports = router;
