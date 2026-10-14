# MOVEL

마크다운으로 쓰는 웹 비주얼 노벨 사이트. Next.js 서버로 동작하며 `/admin`에서 콘텐츠를 관리합니다.

## 구조

| 경로 | 내용 |
| --- | --- |
| `seed/` | 초기 콘텐츠. `data/`가 비어 있으면 최초 실행 시 복사됨 |
| `data/` | 실제 콘텐츠 (설정, 페이지, 에피소드, 미디어). git에 포함되지 않음 → **백업 대상** |
| `lib/episode.js` | 에피소드 스크립트 파서 |
| `components/Player.js` | 플레이어 |
| `app/admin/` | 관리자 화면 |

## 개발

```bash
cp .env.example .env   # ADMIN_PASSWORD, SESSION_SECRET 채우기
npm install
npm run dev
```

## 서버 배포 (Docker)

```bash
git clone <repo> movel && cd movel
cp .env.example .env && vi .env      # ADMIN_PASSWORD, SESSION_SECRET 설정
docker compose up -d --build
```

- 콘텐츠는 `./data` 폴더에 저장됩니다 (컨테이너를 지우거나 새로 빌드해도 유지). **백업 대상은 이 폴더 하나**입니다.
- `data`가 비어 있으면 첫 실행 때 `seed/`로 채워집니다.
- 컨테이너는 `127.0.0.1:<MOVEL_PORT>`(기본 3000)에만 열려 있으므로 같은 서버의 nginx로 프록시합니다. 포트는 `.env`의 `MOVEL_PORT`로 바꿉니다.

업데이트:

```bash
git pull && docker compose up -d --build
```

### nginx

```nginx
server {
    server_name example.com;
    client_max_body_size 50m;   # 미디어 업로드

    location / {
        proxy_pass http://127.0.0.1:3000;   # .env의 MOVEL_PORT와 맞춘다
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

HTTPS는 certbot 등으로 설정합니다. HTTPS 없이 IP로 먼저 테스트할 때는 `.env`에 `COOKIE_SECURE=false`를 넣어야 로그인이 유지됩니다.
