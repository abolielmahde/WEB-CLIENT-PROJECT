import express from "express";
import session from "express-session";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const PLAYLISTS_DIR = path.join(DATA_DIR, "playlists");
const UPLOADS_DIR = path.join(__dirname, "uploads");

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(PLAYLISTS_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// ---------- Middlewares ----------
app.use(express.json({ limit: "1mb" }));
app.use(session({
  secret: process.env.SESSION_SECRET || "dev-secret-change-me",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true }
}));

// Serve uploads
app.use("/uploads", express.static(UPLOADS_DIR));

// Serve static client
app.use(express.static(path.join(__dirname, "public")));

// ---------- Helpers ----------
function readJson(file, fallback){
  try{
    if(!fs.existsSync(file)) return fallback;
    const raw = fs.readFileSync(file, "utf-8");
    return JSON.parse(raw);
  }catch(e){
    console.error("readJson failed", file, e);
    return fallback;
  }
}
function writeJson(file, obj){
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(obj, null, 2));
}

function usersAll(){
  return readJson(USERS_FILE, []);
}
function usersSave(arr){
  writeJson(USERS_FILE, arr);
}

function requireAuth(req, res, next){
  if(!req.session?.user){
    return res.status(401).send("Not authenticated");
  }
  next();
}

function getPlaylistFile(username){
  return path.join(PLAYLISTS_DIR, `${username}.json`);
}
function playlistsGet(username){
  return readJson(getPlaylistFile(username), []);
}
function playlistsSave(username, playlists){
  writeJson(getPlaylistFile(username), playlists);
}

function makeId(prefix="pl"){
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
}

function passwordOk(pw){
  if(typeof pw !== "string" || pw.length < 6) return false;
  const hasLetter = /[A-Za-zא-ת]/.test(pw);
  const hasDigit = /\d/.test(pw);
  const hasSpecial = /[^A-Za-zא-ת0-9]/.test(pw);
  return hasLetter && hasDigit && hasSpecial;
}

// ---------- AUTH ----------
app.post("/api/auth/register", (req, res)=>{
  const { username, firstName, password, imageUrl } = req.body || {};
  if(!username || !firstName || !password){
    return res.status(400).send("Missing required fields");
  }
  if(!passwordOk(password)){
    return res.status(400).send("Password policy failed");
  }

  const users = usersAll();
  const exists = users.some(u => u.username.toLowerCase() === username.toLowerCase());
  if(exists) return res.status(409).send("Username already exists");

  const user = { username, firstName, password, imageUrl: imageUrl || "" };
  users.push(user);
  usersSave(users);

  // init playlists file
  const plFile = getPlaylistFile(username);
  if(!fs.existsSync(plFile)){
    playlistsSave(username, []);
  }

  res.json({ ok: true, user: { username, firstName, imageUrl: imageUrl || "" } });
});

app.post("/api/auth/login", (req, res)=>{
  const { username, password } = req.body || {};
  if(!username || !password) return res.status(400).send("Missing credentials");

  const users = usersAll();
  const found = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
  if(!found) return res.status(401).send("Bad credentials");

  req.session.user = { username: found.username, firstName: found.firstName, imageUrl: found.imageUrl || "" };
  res.json({ ok:true, user: req.session.user });
});

app.post("/api/auth/logout", (req, res)=>{
  req.session.destroy(()=> {
    res.json({ ok:true });
  });
});

app.get("/api/me", (req,res)=>{
  res.json({ user: req.session?.user || null });
});

// ---------- PLAYLISTS ----------
app.get("/api/playlists", requireAuth, (req,res)=>{
  const username = req.session.user.username;
  res.json({ playlists: playlistsGet(username) });
});

app.post("/api/playlists", requireAuth, (req,res)=>{
  const username = req.session.user.username;
  const { name } = req.body || {};
  if(!name) return res.status(400).send("Missing playlist name");
  const playlists = playlistsGet(username);
  const id = makeId("pl");
  const pl = { id, name, createdAt: Date.now(), items: [] };
  playlists.unshift(pl);
  playlistsSave(username, playlists);
  res.json({ playlist: pl });
});

app.get("/api/playlists/:id", requireAuth, (req,res)=>{
  const username = req.session.user.username;
  const playlists = playlistsGet(username);
  const pl = playlists.find(p => p.id === req.params.id);
  if(!pl) return res.status(404).send("Not found");
  res.json({ playlist: pl });
});

app.put("/api/playlists/:id", requireAuth, (req,res)=>{
  const username = req.session.user.username;
  const playlists = playlistsGet(username);
  const idx = playlists.findIndex(p => p.id === req.params.id);
  if(idx < 0) return res.status(404).send("Not found");

  const { name, items } = req.body || {};
  if(name !== undefined) playlists[idx].name = name;
  if(items !== undefined) playlists[idx].items = items;

  playlistsSave(username, playlists);
  res.json({ playlist: playlists[idx] });
});

app.delete("/api/playlists/:id", requireAuth, (req,res)=>{
  const username = req.session.user.username;
  let playlists = playlistsGet(username);
  playlists = playlists.filter(p => p.id !== req.params.id);
  playlistsSave(username, playlists);
  res.json({ ok:true });
});

// Add YouTube item to playlist
app.post("/api/playlists/:id/items", requireAuth, (req,res)=>{
  const username = req.session.user.username;
  const { item } = req.body || {};
  if(!item) return res.status(400).send("Missing item");
  const playlists = playlistsGet(username);
  const pl = playlists.find(p => p.id === req.params.id);
  if(!pl) return res.status(404).send("Playlist not found");

  pl.items = pl.items || [];
  const exists = pl.items.some(x => x.type === item.type && x.videoId === item.videoId && x.url === item.url);
  if(!exists){
    pl.items.unshift({ ...item, addedAt: Date.now(), rating: item.rating || 0 });
  }
  playlistsSave(username, playlists);
  res.json({ playlist: pl });
});

// ---------- MP3 Upload ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const u = req.session?.user?.username;
    if(!u) return cb(new Error("Not authenticated"));
    const dir = path.join(UPLOADS_DIR, u);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}_${safe}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype === "audio/mpeg" || file.originalname.toLowerCase().endsWith(".mp3");
    cb(ok ? null : new Error("Only MP3 allowed"), ok);
  }
});

app.post("/api/upload", requireAuth, upload.single("file"), (req,res)=>{
  const username = req.session.user.username;
  const playlistId = req.body.playlistId;
  if(!playlistId) return res.status(400).send("Missing playlistId");

  const playlists = playlistsGet(username);
  const pl = playlists.find(p => p.id === playlistId);
  if(!pl) return res.status(404).send("Playlist not found");

  const file = req.file;
  if(!file) return res.status(400).send("Missing file");

  const url = `/uploads/${encodeURIComponent(username)}/${encodeURIComponent(file.filename)}`;

  pl.items = pl.items || [];
  pl.items.unshift({
    type: "mp3",
    title: file.originalname,
    url,
    thumb: "", // optional
    duration: "",
    views: "",
    rating: 0,
    addedAt: Date.now()
  });

  playlistsSave(username, playlists);
  res.json({ ok:true, url, playlist: pl });
});

// ---------- SPA fallback ----------
app.get("*", (req,res)=>{
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, ()=> console.log(`Server running http://localhost:${PORT}`));
