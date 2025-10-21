# 💄 화장품 영상 생성기 - Google Veo 3 버전

Google Vertex AI Veo 3를 사용한 **진짜 동영상** 생성 백엔드

## 🎬 특징

- ✅ **실제 동영상 생성** (이미지 슬라이드가 아님)
- ✅ Google Veo 3 - 최신 AI 비디오 생성 기술
- ✅ 8초 고품질 영상
- ✅ 9:16 Instagram Reel 포맷
- ✅ 자연스러운 움직임과 전환

## 🔑 필요한 것

### 1. Google Cloud 설정
- Google Cloud 프로젝트
- Vertex AI API 활성화
- 서비스 계정 JSON 키

### 2. 환경 변수
- `GOOGLE_CLOUD_PROJECT`: 프로젝트 ID
- `GOOGLE_CLOUD_LOCATION`: 리전 (기본: us-central1)
- `GOOGLE_APPLICATION_CREDENTIALS`: JSON 키 파일 경로

## 🚀 Railway 배포 방법

### 1. GitHub 저장소 업로드
이 폴더의 모든 파일을 GitHub에 업로드

### 2. Railway에서 배포
1. New Project → GitHub Repository 선택
2. 저장소 선택
3. 자동 배포 시작

### 3. 환경 변수 설정

#### Railway Variables 탭에서:

**GOOGLE_CLOUD_PROJECT**
```
your-project-id
```

**GOOGLE_CLOUD_LOCATION**
```
us-central1
```

**GOOGLE_APPLICATION_CREDENTIALS_JSON**
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  ...
}
```

⚠️ **중요**: JSON 전체를 문자열로 복사해서 붙여넣기

### 4. 배포 스크립트 (선택)

Railway가 자동으로 JSON을 파일로 저장하도록 `start` 스크립트 수정:

```json
"scripts": {
  "start": "node setup-credentials.js && node server.js"
}
```

## 📡 API 엔드포인트

### POST `/api/generate`

**Request:**
```json
{
  "concept": "비건 립스틱, 핑크톤, 럭셔리 무드",
  "style": "luxury",
  "color": "nude",
  "mood": 75
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "uuid",
  "videoUrl": "https://storage.googleapis.com/...",
  "concept": "비건 립스틱, 핑크톤, 럭셔리 무드",
  "style": "luxury",
  "color": "nude",
  "mood": 75,
  "generatedBy": "Google Veo 3"
}
```

### GET `/api/health`
서버 상태 확인

## 💰 비용

- Veo 3: 약 $0.30-0.50 / 8초 영상
- 이전 DALL-E 3 방식보다 비싸지만 **진짜 동영상**!

## 🔧 로컬 테스트

```bash
# 패키지 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일 편집

# 서비스 계정 JSON 저장
# service-account-key.json 파일 생성

# 서버 실행
npm start
```

## ⚡ 생성 프로세스

1. 사용자 입력 → 프롬프트 생성
2. Veo 3 API 호출
3. AI 비디오 생성 (1-2분)
4. 결과 URL 반환

---

**이제 진짜 동영상 서비스입니다!** 🎉
