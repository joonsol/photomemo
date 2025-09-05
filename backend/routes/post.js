const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const authenticateToken = (req, res, next) => {
    const token =req.cookies.token;

    if(!token){
        return res.status(401).json({message:"토큰이 없습니다.11"})
    }
    try {
        const decoded =jwt.verify(token,process.env.JWT_SECRET)
        req.user=decoded;
        next()
    } catch (error) {
        
        return res.status(403).json({message:"유효하지 않은 토큰 123"})
    }
}

router.post("/",async(req, res)=>{
    try {
        const {title, content, fileUrl}=req.body;

        const latestPost =await Post.findOne().sort({number:-1})
        const nextNumber = latestPost? latestPost.number+1:1;

        const post = new Post({
            number:nextNumber,
            title,
            content,
            fileUrl
        })

        await post.save();
        res.status(201).json(post)
    } catch (error) {
        return res.status(500).json({message:"서버 오류가 발생했습니다."})
        
    }
})

router.get("/",async(req,res)=>{
    try {
        const posts= await Post.find().sort({createdAt:-1})
        res.json(posts)
    } catch (error) {
        res.status(500).json({message:"서버 오류 get"})
    }
})

router.get("/:id", async (req, res) => {
  try {
    // 요청된 ID로 게시글을 MongoDB에서 조회
    const post = await Post.findById(req.params.id)

    // 게시글이 존재하지 않을 경우 404 응답
    if (!post) {
      return res.status(404).json({ message: "게시글을 찾을 수 없습니다." })
    }

    /*
    // ▼▼▼ 아래는 'IP + User-Agent 기반으로 중복 조회 방지 후 조회수 증가' 로직 ▼▼▼

    // 1. 사용자 IP 주소 가져오기 (우선 외부 API → 실패 시 req.ip 사용)
    let ip;
    try {
      const response = await axios.get("https://api.ipify.org?format=json");
      ip = response.data.ip;
    } catch (error) {
      console.log("IP 주소를 가져오던 중 오류 발생: ", error.message);
      ip = req.ip; // fallback
    }

    // 2. 사용자 브라우저 정보 추출
    const userAgent = req.headers["user-agent"];

    // 3. 24시간 전 시각 계산
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 4. 이미 같은 IP와 User-Agent로 24시간 내에 조회했는지 확인
    const hasRecentView = post.viewLogs.some(
      (log) =>
        log.ip === ip &&
        log.userAgent === userAgent &&
        new Date(log.timestamp) > oneDayAgo
    );

    // 5. 중복 조회가 아니면 조회수 증가 + 로그 기록
    if (!hasRecentView) {
      post.views += 1; // 조회수 증가
      post.viewLogs.push({
        ip,
        userAgent,
        timestamp: new Date(),
      });
      await post.save(); // 변경사항 저장
    }
    */

    // 현재는 조회수 증가 로직 없이 post를 그대로 저장하고 응답 (불필요하면 이 줄은 삭제해도 무방)
    await post.save();

    // 조회된 게시글 데이터를 클라이언트에 응답
    res.json(post);

  } catch (error) {
    // 예외 발생 시 500 서버 오류 반환
    res.status(500).json({ message: "서버오류 get" })
  }
})

router.put("/:id", async (req, res) => {
  try {
    // 클라이언트에서 전달된 수정 데이터 추출
    const { title, content, fileUrl } = req.body;

    // 해당 ID의 게시글이 DB에 존재하는지 조회
    const post = await Post.findById(req.params.id);

    // 게시글이 없으면 404 Not Found 응답 반환
    if (!post) {
      return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
    }

    // 게시글 정보 업데이트
    post.title = title;              // 제목 수정
    post.content = content;          // 내용 수정
    post.fileUrl = fileUrl;          // 첨부 파일 수정
    post.updatedAt = Date.now();     // 수정 시간 갱신

    // 수정된 게시글을 DB에 저장
    await post.save();

    // 클라이언트에 성공 응답 반환 (수정된 게시글 데이터)
    res.json(post);

  } catch (error) {
    // 예외 발생 시 500 서버 오류 응답
    return res.status(500).json({ message: "서버 오류 put" });
  }
});


router.delete("/:id", async (req, res) => {
  try {
    // 요청된 ID를 기반으로 게시글을 DB에서 조회
    const post = await Post.findById(req.params.id);

    // 게시글이 존재하지 않으면 404 오류 반환
    if (!post) {
      return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
    }

    // 게시글 본문(content)에서 이미지 URL 추출 (S3 주소 중 확장자 포함된 것만 추출)
    const imgRegex =
      /https:\/\/[^"']*?\.(?:png|jpg|jpeg|gif|PNG|JPG|JPEG|GIF)/g;

    // 본문에 있는 이미지 URL 목록을 배열로 반환 (없으면 빈 배열)
    const contentImages = post.content.match(imgRegex) || [];

    // S3 URL → S3 객체 키(key) 추출 함수
    const getS3KeyFromUrl = (url) => {
      try {
        const urlObj = new URL(url);                // URL 객체로 파싱
        return decodeURIComponent(urlObj.pathname.substring(1)); // "/버킷경로"에서 앞의 슬래시 제거
      } catch (error) {
        console.log("URL 파싱 에러: ", error);
        return null;
      }
    };

    // 삭제 대상 파일 URL 리스트 생성 (본문 이미지 + 첨부 파일)
    const allFiles = [...contentImages, ...(post.fileUrl || [])];

    // 각 파일 URL을 반복하면서 S3에서 삭제
    for (const fileUrl of allFiles) {
      const key = getS3KeyFromUrl(fileUrl); // key 추출
      if (key) {
        console.log("파일 삭제 시작: ", key);
        try {
          // AWS S3에서 해당 파일 삭제 요청
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME, // 삭제할 S3 버킷
              Key: key,                            // 삭제할 파일의 키
            })
          );
          console.log("파일 삭제 완료: ", key);
        } catch (error) {
          console.log("S3 파일 삭제 에러: ", error);
        }
      }
    }

    // 게시글 자체를 DB에서 삭제
    await post.deleteOne();

    // 성공 응답 반환
    res.json({ message: "게시글이 삭제가 되었습니다." });

  } catch (error) {
    // 서버 내부 에러 처리
    return res.status(500).json({ message: "서버 오류 delete" });
  }
});

module.exports=router