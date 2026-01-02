(async function(){
  const { mountHeader, toast, openModal, closeModal } = window.UI;
  const S = window.StorageUtil;
  const YT = window.YouTubeAPI;

  mountHeader("search.html");

  const user = S.ensureAuthOrRedirect();
  if(!user) return;

  const qInput = document.getElementById("q");
  const searchBtn = document.getElementById("searchBtn");
  const status = document.getElementById("status");
  const resultsEl = document.getElementById("results");

  function setStatus(type, text){
    if(!text){
      status.innerHTML = "";
      return;
    }
    const cls = type === "error" ? "error" : type === "success" ? "success" : "card pad";
    status.innerHTML = `<div class="${cls}">${text}</div>`;
  }

  function getUserPlaylistsFlat(){
    const pls = S.getUserPlaylists(user.username);
    const allItems = [];
    for(const p of pls){
      for(const it of (p.items || [])){
        allItems.push({playlistId: p.id, ...it});
      }
    }
    return {pls, allItems};
  }

  function isVideoInAnyPlaylist(videoId){
    const { allItems } = getUserPlaylistsFlat();
    return allItems.some(it => it.type === "youtube" && it.videoId === videoId);
  }

  function openPlayer(videoId, title){
    openModal({
      title: title || "נגן",
      bodyHtml: `
        <iframe class="player" src="https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen></iframe>
      `
    });
  }

  function renderCards(items){
    resultsEl.innerHTML = "";
    for(const it of items){
      const title = it.snippet?.title || "";
      const thumb = it.snippet?.thumbnails?.medium?.url || it.snippet?.thumbnails?.default?.url || "";
      const duration = S.iso8601DurationToHMS(it.contentDetails?.duration || "");
      const views = S.formatViews(it.statistics?.viewCount || "");
      const videoId = it.id;
      const inFav = isVideoInAnyPlaylist(videoId);

      const card = document.createElement("div");
      card.className = "video-card";
      card.innerHTML = `
        <img class="video-thumb" src="${thumb}" alt="${title}"/>
        <div class="badge">
          ${duration ? `<span class="pill">⏱ ${duration}</span>` : ""}
          ${views ? `<span class="pill">👁 ${views}</span>` : ""}
          ${inFav ? `<span class="icon-check" title="כבר במועדפים"></span>` : ""}
        </div>
        <div class="video-body">
          <div class="title" title="${title}">${title}</div>
          <div class="meta-row">
            <span>נגן ▶</span>
            <button class="btn ${inFav ? "disabled" : ""}" ${inFav ? "disabled" : ""} data-add="1">
              ${inFav ? "במועדפים" : "הוסף למועדפים"}
            </button>
          </div>
        </div>
      `;

      const onPlay = ()=> openPlayer(videoId, title);
      card.querySelector(".video-thumb").addEventListener("click", onPlay);
      card.querySelector(".title").addEventListener("click", onPlay);

      const addBtn = card.querySelector("[data-add]");
      addBtn.addEventListener("click", ()=> openAddToPlaylistDialog({
        videoId, title, thumb, duration,
        views: it.statistics?.viewCount || ""
      }));

      resultsEl.appendChild(card);
    }
  }

  function openAddToPlaylistDialog(video){
    const { pls } = getUserPlaylistsFlat();

    const existingOptions = pls.map(p => `<option value="${p.id}">${p.name}</option>`).join("");
    openModal({
      title: "הוספה למועדפים",
      bodyHtml: `
        <div class="form">
          <div>
            <label>בחר פלייליסט קיים</label>
            <select id="plSelect">
              <option value="">— בחר —</option>
              ${existingOptions}
            </select>
          </div>

          <div style="text-align:center; color: rgba(255,255,255,0.35)">או</div>

          <div>
            <label>צור פלייליסט חדש</label>
            <input id="plNewName" placeholder="שם פלייליסט חדש" />
          </div>

          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button class="btn" id="confirmAdd" type="button">אישור</button>
            <button class="btn secondary" id="cancelAdd" type="button">ביטול</button>
          </div>
        </div>
      `
    });

    document.getElementById("cancelAdd").addEventListener("click", closeModal);

    document.getElementById("confirmAdd").addEventListener("click", ()=>{
      const plId = document.getElementById("plSelect").value;
      const newName = document.getElementById("plNewName").value.trim();

      let targetId = plId;
      let playlists = S.getUserPlaylists(user.username);

      if(!targetId){
        if(!newName){
          toast({title:"חסר מידע", message:"בחר פלייליסט קיים או כתוב שם לפלייליסט חדש."});
          return;
        }
        targetId = S.makeId("pl");
        playlists = [
          { id: targetId, name: newName, createdAt: Date.now(), items: [] },
          ...playlists
        ];
      }

      const idx = playlists.findIndex(p => p.id === targetId);
      if(idx < 0){
        toast({title:"שגיאה", message:"לא נמצא פלייליסט יעד."});
        return;
      }

      const exists = (playlists[idx].items || []).some(it => it.type === "youtube" && it.videoId === video.videoId);
      if(!exists){
        playlists[idx].items = playlists[idx].items || [];
        playlists[idx].items.unshift({
          type: "youtube",
          videoId: video.videoId,
          title: video.title,
          thumb: video.thumb,
          duration: video.duration,
          views: video.views,
          rating: 0,
          addedAt: Date.now()
        });
        S.setUserPlaylists(user.username, playlists);
      }

      closeModal();
      toast({
        title: "נשמר במועדפים",
        message: `הוספנו ל"${playlists[idx].name}".`,
        actionLabel: "פתח פלייליסט",
        actionHref: `playlists.html?pid=${encodeURIComponent(targetId)}`
      });

      const last = S.loadJSON(S.LAST_SEARCH_KEY, null);
      if(last?.items) renderCards(last.items);
    });
  }

  async function runSearch(query){
    const q = (query || "").trim();
    if(!q){
      setStatus("error", "יש להקליד מחרוזת חיפוש.");
      return;
    }

    setStatus("", "");
    resultsEl.innerHTML = "";
    setStatus("success", "טוען תוצאות...");

    try{
      const ids = await YT.youtubeSearch(q, 12);
      const details = await YT.youtubeVideosDetails(ids);
      const items = details.map(v => ({ id: v.id, ...v }));

      setStatus("success", `נמצאו ${items.length} תוצאות.`);
      renderCards(items);

      S.saveJSON(S.LAST_SEARCH_KEY, { q, items, savedAt: Date.now() });
      S.qsSet({ q });

    }catch(err){
      console.error(err);
      setStatus("error", err.message || "שגיאה בחיפוש.");
    }
  }

  searchBtn.addEventListener("click", ()=> runSearch(qInput.value));
  qInput.addEventListener("keydown", (e)=>{ if(e.key === "Enter") runSearch(qInput.value); });

  const qsQ = S.qsGet("q");
  if(qsQ){
    qInput.value = qsQ;
    runSearch(qsQ);
  }else{
    const last = S.loadJSON(S.LAST_SEARCH_KEY, null);
    if(last?.q){
      qInput.value = last.q;
      if(last.items){
        setStatus("success", `משוחזר חיפוש אחרון: "${last.q}"`);
        renderCards(last.items);
      }
    }
  }
})();
