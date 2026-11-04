# 임한글 포트폴리오

RPG 캐릭터 시트 형식의 보안 포트폴리오입니다.
GitHub Pages: https://hangeul245.github.io

## 파일 구성

| 파일 | 역할 |
|---|---|
| `index.html` | 페이지 전체 (도트 글꼴 Galmuri11 내장) |
| `data.json` | 블로그·GitHub 데이터. 자동으로 갱신됩니다 |
| `scripts/update-data.mjs` | 블로그 RSS·첫 화면과 GitHub API에서 데이터를 가져와 `data.json`을 갱신 |
| `.github/workflows/deploy.yml` | push할 때와 6시간마다 데이터를 갱신하고 Pages에 배포 |

## 처음 올리기

1. GitHub에서 **`Hangeul245.github.io`** 라는 이름으로 공개 저장소를 만듭니다.
2. 이 폴더의 파일을 모두 올립니다. `.github` 폴더도 꼭 함께 올려야 합니다.
   ```bash
   git init && git add . && git commit -m "포트폴리오 첫 배포"
   git branch -M main
   git remote add origin https://github.com/Hangeul245/Hangeul245.github.io.git
   git push -u origin main
   ```
3. 저장소 **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 바꿉니다.
4. **Actions** 탭에서 "데이터 갱신 및 배포"가 끝나면 https://hangeul245.github.io 에서 보입니다.
   첫 실행이 Pages 설정보다 먼저 돌아 실패했다면, Actions 탭에서 **Run workflow**로 다시 실행하세요.

## 자동으로 바뀌는 것

- **레벨**: 생일(2005-10-16) 기준 만 나이. 생일마다 레벨이 오르고, 다음 레벨업까지 D-day가 보입니다.
- **블로그**: 전체 글 수, 분류별 글 수, 최근 글 목록, 경험치 게이지, "성실한 기록자" 업적 (6시간마다)
- **GitHub**: 저장소 목록·언어·최근 작업일은 방문할 때마다 실시간, 커밋 수는 6시간마다
- **커밋 장인 업적**: 커밋이 가장 많은 저장소 기준

바로 갱신하고 싶으면 Actions 탭 → "데이터 갱신 및 배포" → **Run workflow**를 누르세요.

## 직접 고칠 곳

- 생일, GitHub 아이디: `index.html` 아래쪽 `CONFIG`
- 퀘스트·업적·인벤토리·세이브 포인트: `index.html`에서 해당 섹션 주석(`<!-- 퀘스트 -->` 등)을 찾아 수정
- 노션을 정리하면: `Notion · LOCKED` 버튼을 링크로 바꾸고, "노션 정리 완료" 업적의 `locked` 클래스를 지우면 달성 처리됩니다.

## 참고

- 블로그 분류별 글 수는 티스토리 스킨의 분류 목록을 읽어 옵니다. 스킨을 바꿔 읽지 못하면 이전 값을 그대로 둡니다.
- 글꼴: [갈무리(Galmuri)](https://github.com/quiple/galmuri), SIL Open Font License 1.1
