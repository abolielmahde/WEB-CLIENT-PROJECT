// ===== YouTube API wrapper (no modules) =====
window.YouTubeAPI = (function(){
  const BASE = "https://www.googleapis.com/youtube/v3";

  function ensureKey(){
    if(!window.YOUTUBE_API_KEY){
      throw new Error('חסר API KEY. פתח/י את js/config.js והדבק/י את המפתח ב-window.YOUTUBE_API_KEY');
    }
  }

  async function youtubeSearch(query, maxResults=12){
    ensureKey();
    const url = new URL(`${BASE}/search`);
    url.searchParams.set("part", "snippet");
    url.searchParams.set("type", "video");
    url.searchParams.set("q", query);
    url.searchParams.set("maxResults", String(maxResults));
    url.searchParams.set("key", window.YOUTUBE_API_KEY);

    const res = await fetch(url);
    if(!res.ok){
      const text = await res.text();
      throw new Error(`שגיאת YouTube search: ${res.status} ${text}`);
    }
    const data = await res.json();
    const ids = (data.items || []).map(it => it.id?.videoId).filter(Boolean);
    return ids;
  }

  async function youtubeVideosDetails(videoIds){
    ensureKey();
    if(!videoIds.length) return [];

    const url = new URL(`${BASE}/videos`);
    url.searchParams.set("part", "snippet,contentDetails,statistics");
    url.searchParams.set("id", videoIds.join(","));
    url.searchParams.set("key", window.YOUTUBE_API_KEY);

    const res = await fetch(url);
    if(!res.ok){
      const text = await res.text();
      throw new Error(`שגיאת YouTube videos: ${res.status} ${text}`);
    }
    const data = await res.json();
    return data.items || [];
  }

  return { youtubeSearch, youtubeVideosDetails };
})();
