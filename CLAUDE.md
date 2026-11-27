# 월영 — 모바일 웹 게임

"죽는 순간, 인연이 너를 다시 일으킨다." 선협 판타지 한 손 생존 로그라이트(4분 한 판) + 동료 인연 스토리.
사용자는 프로그래밍 초보. 설명은 쉬운 말로, 명령은 Claude가 직접 실행한다. 답은 한국어로.

## 시작할 때
- 새 대화는 이 파일과 PROGRESS.md부터 읽는다. 기획서 `docs/기획서.md`는 그 단계에 필요한 부분만 찾아 읽는다(전문, 고치지 않는다).
- 한 대화 = 한 단계(기획서 15번). 시작 전 만들 것을 3~5줄로 알리고, 끝나면 멈춘다. 사용자가 "다음"이라고 하면 다음 단계.
- 기획에 없는 큰 결정은 먼저 묻고, 작은 결정은 기획서 0번 판단 순서로 정해 보고에 적는다.

## 명령어 (Node는 PATH에 없을 수 있음: `C:\Program Files\nodejs`를 PATH 앞에 붙여 실행)
- `npm run dev` 개발 서버(같은 와이파이 휴대폰: http://<노트북 IP>:5173)
- `npm run check` 빌드 + Playwright 점검(자동 플레이 한 판, 같은 시드 재현, 잡귀 150마리 평균 50프레임). 단계 끝에 반드시 통과
- `node scripts/shot.mjs <png> "<?값>" <ms> ["S.book.learn('lotus')"]` 빌드본 화면 사진(확인용, S=게임 장면).
- `node scripts/probe.mjs "<?값>" <초> "<식>"` 3초마다 게임 안 값을 찍기(밸런스 확인용). 모든 node를 끄는 taskkill은 쓰지 않는다(개발 서버도 꺼짐)
- `npm run build` → `dist/`. main에 push하면 GitHub Actions가 GitHub Pages로 배포(`.github/workflows/deploy.yml`)
- 배포 주소: https://yong2514.github.io/wolyoung/ (Vite base `/wolyoung/`, vite.config.js). gh는 `C:\Program Files\GitHub CLI`

## 기술 규칙 (기획서 12번 요약)
- Phaser 3.90.0 고정, Arcade 물리만, JS ES 모듈, Vite. 기준 화면 390×844 세로, Scale FIT, safe-area 반영
- 밸런스 수치는 전부 `src/config/balance.js`(+ `balance_spells.js` 법술·카드, `balance_waves.js` 웨이브·요괴·경지, `balance_boss.js` 보스). 코드에 숫자를 직접 쓰지 않는다
- 무작위는 `src/systems/rng.js` 시드 난수 하나만. Math.random 금지
- 시간은 게임 안 시계 하나(`systems/clock.js`, 일시정지·카드·느려지기 반영). 웨이브·쿨타임·무적에 Date.now 금지
- 게임은 고정 걸음(STEP=1/60초)으로만 진행 → 같은 시드+같은 입력이면 같은 판. 화면 효과 난수는 `rng.fork('fx')`처럼 갈라 써서 게임 흐름에 영향 없게
- 요괴·탄·구슬·숫자·파티클은 오브젝트 풀링. 가까운 적 찾기·충돌은 공간 격자
- 아군 효과는 남색·은색·연보라, 요괴 공격·예고는 붉은·주황만. 위협 공격은 0.5초 이상 예고
- 버튼은 화면 아래 60% 안, 터치 영역 48px 이상. 왼손 모드(좌우 반전)
- 진동은 지원 확인 후, 소리는 첫 터치 때 켬(Web Audio 합성, 동시 재생 수 제한)
- 주소로 들어온 값은 정해진 형식만, 화면엔 글자로만(HTML로 넣지 않음)
- 한 파일 300줄 넘으면 나눈다. 다른 작품의 그림·음악·폰트·인물·대사 금지. 확률형 뽑기·행동력 금지
- 하루 기준은 기기 시각 새벽 4시. 저장은 localStorage(버전 번호 + 옛 구조 옮기기)
- `?debug=1` 디버그 버튼, `?debug=1&auto=1` 자동 플레이(점검이 결과 한 줄을 콘솔에서 읽음)
- 자동 점검이 읽는 값: `window.__wolyoung` (game, errors, ready)

## 폴더
- `src/main.js` 게임 시작 설정
- `src/config/` balance.js(밸런스), assets.js(이미지·소리 경로), display.js(화면 크기·색)
- `src/data/` story.js(동료 대사), spells.js, enemies.js
- `src/scenes/` BootScene(도형 그림: playerTexture·enemyTextures·bossTextures) → GameScene(한 판)
- 레벨업 카드는 고르는 화면 없이 바닥에 3장 떨어지고 모두 주울 수 있음(fieldCards). 카드 효과는 45초만(spellbook base+timed). 작은 지도 ui/minimap.js (사용자 요청)
- 판은 결계 벽 안 장소(systems/arena.js)에서 하고 60초마다 다음 장소로 옮긴다(사용자 요청). 새 위치는 arena.clamp/spawnPoint로 벽 안에
- 요괴: enemies(풀·맞기·죽기)·enemyAI(행동·예고)·enemyBullets·waves(웨이브)·chests·realm(경지 돌파)·bosses(요장·요황)
- `src/systems/` rng·clock·pool·grid·params(주소 값)·settings·audio(합성음)·effects(조각·숫자·flash·흔들림·진동)·enemies·player·perf·autoplay
  - orbs(영기 구슬)·leveling(영기·레벨)·cards(카드 3장 뽑기, cardRng)·spellbook(가진 법술·보조 능력치)
  - `spells/` base(단계별 수치 stat())·공격 9종 파일·fusions(합일 4종). 새 공격 법술 = 여기 클래스 + spellbook ATTACK_CLASSES + data/spells.js + balance_spells
  - 법술이 사라질 수 있으니(합일 재료·호신강기) 화면에 남는 그림이 있으면 destroy()를 둔다
  - 법술마다 최대 단계가 다를 수 있다(balance의 maxLevel → book.maxLevel(key)). 카드 3장은 같은 단계만(사용자 요청)
- `src/ui/` joystick·hud·minimap·button·skillButton·targeting(멸요인)·overlays(판의 끝·일시정지·3초 세기)·debug(HTML 패널)
- `scripts/check.mjs` 자동 점검, `docs/기획서.md` 기획 전문, `PROGRESS.md` 진행 상황

## 작업 방식
- 단계마다(중간에도 잘 돌아가는 지점마다) git 커밋. PROGRESS.md에 끝난 것·다음 할 일·알려진 문제를 적는다.
- 보고: 만든 내용(5줄 이내), 휴대폰 확인 항목(5개 이내), 휴대폰에서 여는 방법, 내가 정한 작은 결정.
