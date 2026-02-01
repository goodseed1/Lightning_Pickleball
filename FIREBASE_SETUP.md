# 🔥 Firebase 프로젝트 설정 가이드

## Lightning Pickleball - 새 Firebase 프로젝트 생성

> ⚠️ **중요**: Lightning Pickleball은 Lightning Tennis와 **완전히 분리된** Firebase 프로젝트를 사용합니다.

---

## 📋 Step 1: Firebase 콘솔에서 새 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. **"프로젝트 추가"** 클릭
3. 프로젝트 이름: `lightning-pickleball`
4. Google Analytics 활성화 (권장)
5. **"프로젝트 만들기"** 클릭

---

## 📱 Step 2: 앱 등록

### iOS 앱 등록
1. Firebase Console → **"iOS 앱 추가"**
2. Bundle ID: `com.lightningpickleball.community`
3. 앱 닉네임: `Lightning Pickleball iOS`
4. `GoogleService-Info.plist` 다운로드 → 프로젝트 루트에 저장

### Android 앱 등록
1. Firebase Console → **"Android 앱 추가"**
2. Package name: `com.lightningpickleball.app`
3. 앱 닉네임: `Lightning Pickleball Android`
4. `google-services.json` 다운로드 → 프로젝트 루트에 저장

---

## 🔑 Step 3: 환경 변수 설정

프로젝트 루트에 `.env` 파일 생성:

```bash
# .env (프로젝트 루트)

# Firebase Configuration - Lightning Pickleball
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key-here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=lightning-pickleball.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=lightning-pickleball
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=lightning-pickleball.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id-here
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id-here

# Optional: Emulator settings
EXPO_PUBLIC_USE_FIREBASE_EMULATORS=false
```

### Firebase 설정값 찾기:
1. Firebase Console → ⚙️ (설정) → 프로젝트 설정
2. "일반" 탭 → 하단 "내 앱" 섹션
3. **SDK 설정 및 구성** → "구성" 선택
4. `firebaseConfig` 객체에서 값 복사

---

## 🛡️ Step 4: Firebase 서비스 활성화

### 4.1 Authentication 설정
Firebase Console → Authentication → 시작하기

**활성화할 로그인 방법:**
- ✅ 이메일/비밀번호
- ✅ Google
- ✅ Apple (iOS용)

### 4.2 Firestore Database 설정
Firebase Console → Firestore Database → 데이터베이스 만들기

**설정:**
- 위치: `us-central1` (또는 가장 가까운 리전)
- 모드: **프로덕션 모드** 선택 (Security Rules는 아래에서 설정)

### 4.3 Storage 설정
Firebase Console → Storage → 시작하기

**설정:**
- 위치: Firestore와 동일한 리전 권장

### 4.4 Cloud Functions 설정
Firebase Console → Functions → 시작하기

**Blaze 플랜 필요** (유료, 사용량 기반)

---

## 📜 Step 5: Security Rules 배포

### Firestore Security Rules
```bash
cd /Volumes/DevSSD/development/Projects/lightning-pickleball
firebase deploy --only firestore:rules
```

### Storage Security Rules
```bash
firebase deploy --only storage
```

---

## ☁️ Step 6: Cloud Functions 배포

```bash
cd /Volumes/DevSSD/development/Projects/lightning-pickleball/functions

# 의존성 설치
npm install

# 빌드
npm run build

# 배포
firebase deploy --only functions
```

---

## 🔗 Step 7: Firebase CLI 프로젝트 연결

```bash
cd /Volumes/DevSSD/development/Projects/lightning-pickleball

# 기존 프로젝트 연결 해제 (필요시)
firebase projects:list

# 새 프로젝트 연결
firebase use lightning-pickleball

# 또는 프로젝트 선택
firebase use --add
```

### `.firebaserc` 파일 확인:
```json
{
  "projects": {
    "default": "lightning-pickleball"
  }
}
```

---

## ✅ Step 8: 설정 확인

```bash
# Firebase 연결 확인
firebase projects:list

# 현재 프로젝트 확인
firebase use

# 앱 실행 테스트
cd /Volumes/DevSSD/development/Projects/lightning-pickleball
npx expo start
```

---

## 🚨 주의사항

1. **절대 Lightning Tennis의 Firebase 프로젝트 ID를 사용하지 마세요!**
   - Tennis: `lightning-tennis-xxxxx`
   - Pickleball: `lightning-pickleball` (새로 생성)

2. **`.env` 파일은 git에 커밋하지 마세요!**
   - `.gitignore`에 `.env` 추가 확인

3. **GoogleService-Info.plist / google-services.json**
   - 이 파일들도 git에 커밋하지 마세요 (API 키 포함)

---

## 📞 문제 해결

### "Firebase configuration incomplete" 에러
→ `.env` 파일의 모든 변수가 설정되었는지 확인

### "Permission denied" 에러
→ Security Rules가 올바르게 배포되었는지 확인

### Cloud Functions 배포 실패
→ Blaze 플랜 활성화 여부 확인

---

*Last Updated: 2025-01-14*
*Project: Lightning Pickleball*
