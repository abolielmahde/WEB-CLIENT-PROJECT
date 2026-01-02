// ===== Storage helpers (no modules) =====
window.StorageUtil = (function(){
  const USERS_KEY = "users";
  const PLAYLISTS_KEY = "playlists_v1";
  const LAST_SEARCH_KEY = "last_search_v1";

  function loadJSON(key, fallback){
    try{
      const raw = localStorage.getItem(key);
      if(!raw) return fallback;
      return JSON.parse(raw);
    }catch(e){
      console.warn("Failed to parse storage key", key, e);
      return fallback;
    }
  }

  function saveJSON(key, value){
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getUsers(){ return loadJSON(USERS_KEY, []); }
  function setUsers(users){ saveJSON(USERS_KEY, users); }

  function getCurrentUser(){
    try{
      const raw = sessionStorage.getItem("currentUser");
      if(!raw) return null;
      return JSON.parse(raw);
    }catch{
      return null;
    }
  }
  function setCurrentUser(userObj){
    sessionStorage.setItem("currentUser", JSON.stringify(userObj));
  }
  function clearCurrentUser(){ sessionStorage.removeItem("currentUser"); }

  function ensureAuthOrRedirect(){
    const u = getCurrentUser();
    if(!u){
      const here = location.pathname.split("/").pop();
      location.href = `login.html?next=${encodeURIComponent(here + location.search)}`;
      return null;
    }
    return u;
  }

  function getAllPlaylists(){ return loadJSON(PLAYLISTS_KEY, {}); }
  function setAllPlaylists(obj){ saveJSON(PLAYLISTS_KEY, obj); }

  function getUserPlaylists(username){
    const all = getAllPlaylists();
    return all[username] || [];
  }
  function setUserPlaylists(username, playlists){
    const all = getAllPlaylists();
    all[username] = playlists;
    setAllPlaylists(all);
  }

  function makeId(prefix="pl"){
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
  }

  function normalizeText(s){ return (s || "").toString().trim(); }

  function iso8601DurationToHMS(iso){
    if(!iso || typeof iso !== "string") return "";
    const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if(!m) return "";
    const h = parseInt(m[1] || "0", 10);
    const min = parseInt(m[2] || "0", 10);
    const s = parseInt(m[3] || "0", 10);
    const pad = (n)=> n.toString().padStart(2, "0");
    if(h > 0) return `${h}:${pad(min)}:${pad(s)}`;
    return `${min}:${pad(s)}`;
  }

  function formatViews(n){
    const num = Number(n);
    if(!Number.isFinite(num)) return "";
    if(num >= 1_000_000_000) return `${(num/1_000_000_000).toFixed(1).replace(/\.0$/,"")}B`;
    if(num >= 1_000_000) return `${(num/1_000_000).toFixed(1).replace(/\.0$/,"")}M`;
    if(num >= 1_000) return `${(num/1_000).toFixed(1).replace(/\.0$/,"")}K`;
    return `${num}`;
  }

  function qsGet(name){
    const u = new URL(location.href);
    return u.searchParams.get(name);
  }

  function qsSet(params){
    const u = new URL(location.href);
    Object.entries(params).forEach(([k,v]) => {
      if(v === null || v === undefined || v === ""){
        u.searchParams.delete(k);
      }else{
        u.searchParams.set(k, v);
      }
    });
    history.replaceState({}, "", u.toString());
  }

  function debounce(fn, ms=300){
    let t;
    return (...args)=>{
      clearTimeout(t);
      t = setTimeout(()=> fn(...args), ms);
    };
  }

  function escapeHtml(s){
    return (s||"").replace(/[&<>"']/g, ch => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[ch]));
  }

  return {
    USERS_KEY, PLAYLISTS_KEY, LAST_SEARCH_KEY,
    loadJSON, saveJSON,
    getUsers, setUsers,
    getCurrentUser, setCurrentUser, clearCurrentUser, ensureAuthOrRedirect,
    getAllPlaylists, setAllPlaylists, getUserPlaylists, setUserPlaylists,
    makeId, normalizeText, iso8601DurationToHMS, formatViews,
    qsGet, qsSet, debounce, escapeHtml
  };
})();
