# WEB CLIENT – פתרון מלא (Client + Server)

הפרויקט כולל:
- **client/**: אתר סטטי (HTML/CSS/JS) עם LocalStorage + SessionStorage (חלק א').
- **server/**: שרת Node.js/Express עם AUTH + Playlists + העלאת MP3 (חלק ב' – ענף צד שרת).

---

## חלק א' – הרצה כאתר סטטי
1) פתח/י את `client/js/config.js` והדבק/י את YouTube Data API Key בשדה `YOUTUBE_API_KEY`.
2) פתח/י את `client/index.html` בדפדפן.

> טיפ: מומלץ להריץ דרך Live Server ב-VS Code כדי להימנע מבעיות CORS.

---

## חלק ב' – Server (Node.js)
שרת Express שמגיש את האתר כסטטי + API.

### התקנה והרצה
```bash
cd server
npm install
npm start
```

השרת ירוץ כברירת מחדל על:
- http://localhost:3000

### מה נשמר בצד שרת?
- `server/data/users.json` – משתמשים
- `server/data/playlists/<username>.json` – פלייליסטים
- `server/uploads/<username>/...` – קבצי MP3

### API עיקריים
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET  /api/me`
- `GET  /api/playlists`
- `POST /api/playlists`
- `GET  /api/playlists/:id`
- `PUT  /api/playlists/:id`
- `DELETE /api/playlists/:id`
- `POST /api/playlists/:id/items` (YouTube item)
- `POST /api/upload` (MP3 upload)

> הערה: כדי לחבר את ה-client לשרת, יש קבצים ב-`client/js/server_api.js` וגרסה של דפים ב-`server/public/`.
