(function(){
  const { mountHeader, toast, openModal, closeModal } = window.UI;
  const S = window.StorageUtil;

  mountHeader("playlists.html");

  const user = S.ensureAuthOrRedirect();
  if(!user) return;

  const playlistList = document.getElementById("playlistList");
  const itemsEl = document.getElementById("items");
  const mainStatus = document.getElementById("mainStatus");
  const filterInput = document.getElementById("filterInput");
  const sortSelect = document.getElementById("sortSelect");

  const newPlaylistBtn = document.getElementById("newPlaylistBtn");
  const deletePlaylistBtn = document.getElementById("deletePlaylistBtn");
  const playPlaylistBtn = document.getElementById("playPlaylistBtn");

  let playlists = [];
  let activeId = null;

  function setStatus(text, type=""){
    if(!text){ mainStatus.innerHTML = ""; return; }
    const cls = type === "error" ? "error" : "success";
    mainStatus.innerHTML = `<div class="${cls}">${text}</div>`;
  }

  function persist(){
    S.setUserPlaylists(user.username, playlists);
  }

  function load(){
    playlists = S.getUserPlaylists(user.username);
    const pid = S.qsGet("pid");

    if(playlists.length === 0){
      activeId = null;
      renderSidebar();
      renderMain();
      return;
    }

    if(pid && playlists.some(p => p.id === pid)){
      activeId = pid;
    }else{
      activeId = playlists[0].id;
      S.qsSet({ pid: activeId });
    }

    renderSidebar();
    renderMain();
  }

  function renderSidebar(){
    playlistList.innerHTML = "";

    if(playlists.length === 0){
      playlistList.innerHTML = `<div class="muted">אין פלייליסטים עדיין. לחץ/י על “+ פלייליסט חדש”.</div>`;
      return;
    }

    for(const p of playlists){
      const count = (p.items || []).length;
      const row = document.createElement("div");
      row.className = "playlist-item" + (p.id === activeId ? " active" : "");
      row.innerHTML = `
        <div>
          <strong>${p.name}</strong><br/>
          <small>${count} פריטים</small>
        </div>
        <div class="muted">›</div>
      `;
      row.addEventListener("click", ()=>{
        activeId = p.id;
        S.qsSet({ pid: activeId });
        renderSidebar();
        renderMain();
      });
      playlistList.appendChild(row);
    }
  }

  function getActive(){
    return playlists.find(p => p.id === activeId) || null;
  }

  function sortedFilteredItems(items){
    const q = S.normalizeText(filterInput.value).toLowerCase();
    let arr = (items || []).slice();

    if(q){
      arr = arr.filter(it => (it.title || "").toLowerCase().includes(q));
    }

    const sort = sortSelect.value;
    if(sort === "az"){
      arr.sort((a,b)=> (a.title||"").localeCompare(b.title||"", "he"));
    }else if(sort === "rating_desc"){
      arr.sort((a,b)=> (b.rating||0) - (a.rating||0));
    }else{
      arr.sort((a,b)=> (b.addedAt||0) - (a.addedAt||0));
    }

    return arr;
  }

  function renderStars(container, value, onChange){
    container.innerHTML = "";
    const v = Math.max(0, Math.min(5, Number(value) || 0));
    for(let i=1;i<=5;i++){
      const s = document.createElement("span");
      s.className = "star " + (i <= v ? "" : "off");
      s.textContent = "★";
      s.title = `${i}`;
      s.addEventListener("click", ()=> onChange(i));
      container.appendChild(s);
    }
  }

  function playItem(item){
    if(item.type === "youtube"){
      openModal({
        title: item.title || "נגן",
        bodyHtml: `
          <iframe class="player" src="https://www.youtube.com/embed/${encodeURIComponent(item.videoId)}?autoplay=1"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen></iframe>
        `
      });
    }else{
      openModal({
        title: item.title || "נגן",
        bodyHtml: `<audio controls autoplay style="width:100%"><source src="${item.url}" type="audio/mpeg"></audio>`
      });
    }
  }

  function renderMain(){
    const pl = getActive();
    itemsEl.innerHTML = "";

    if(!pl){
      setStatus("בחר פלייליסט מהרשימה.", "success");
      return;
    }

    setStatus(`פלייליסט: "${pl.name}"`, "success");

    const arr = sortedFilteredItems(pl.items || []);
    if(arr.length === 0){
      itemsEl.innerHTML = `<div class="muted" style="margin-top:10px">אין פריטים להצגה.</div>`;
      return;
    }

    for(const it of arr){
      const row = document.createElement("div");
      row.className = "item-row";

      const thumb = it.thumb || "assets/avatar.svg";
      const duration = it.duration ? `⏱ ${it.duration}` : "";
      const views = it.views ? `👁 ${it.views}` : "";

      row.innerHTML = `
        <div>
          <img src="${thumb}" alt="${it.title || ""}" title="נגן" />
        </div>
        <div>
          <div style="font-weight:700">${it.title || ""}</div>
          <div class="muted" style="margin-top:4px">${it.type === "youtube" ? "YouTube" : "MP3"} ${duration} ${views}</div>
        </div>

        <div class="hide-sm">
          <div class="muted">דירוג</div>
          <div data-stars></div>
        </div>

        <div class="hide-sm">
          <button class="btn secondary" data-open>נגן</button>
        </div>

        <div class="hide-sm">
          <button class="btn danger" data-del>מחק</button>
        </div>
      `;

      const play = ()=> playItem(it);
      row.querySelector("img").addEventListener("click", play);
      row.querySelector("[data-open]").addEventListener("click", play);

      const starsWrap = row.querySelector("[data-stars]");
      renderStars(starsWrap, it.rating || 0, (newRating)=>{
        it.rating = newRating;
        persist();
        renderMain();
      });

      row.querySelector("[data-del]").addEventListener("click", ()=>{
        const ok = confirm("למחוק פריט מהפלייליסט?");
        if(!ok) return;
        pl.items = (pl.items || []).filter(x => !(x.type === it.type && x.videoId === it.videoId && x.addedAt === it.addedAt && x.url === it.url));
        persist();
        renderSidebar();
        renderMain();
        toast({title:"נמחק", message:"הפריט נמחק מהפלייליסט."});
      });

      itemsEl.appendChild(row);
    }
  }

  newPlaylistBtn.addEventListener("click", ()=>{
    openModal({
      title: "פלייליסט חדש",
      bodyHtml: `
        <div class="form">
          <div>
            <label>שם פלייליסט</label>
            <input id="plName" placeholder="לדוגמה: מוזיקה לעבודה" />
          </div>
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button class="btn" id="createPlBtn" type="button">צור</button>
            <button class="btn secondary" id="cancelPlBtn" type="button">ביטול</button>
          </div>
        </div>
      `
    });

    document.getElementById("cancelPlBtn").addEventListener("click", closeModal);
    document.getElementById("createPlBtn").addEventListener("click", ()=>{
      const name = S.normalizeText(document.getElementById("plName").value);
      if(!name){
        toast({title:"חסר שם", message:"יש להזין שם לפלייליסט."});
        return;
      }
      const id = S.makeId("pl");
      playlists.unshift({ id, name, createdAt: Date.now(), items: [] });
      activeId = id;
      persist();
      closeModal();
      S.qsSet({ pid: activeId });
      renderSidebar();
      renderMain();
      toast({title:"נוצר", message:`נוצר פלייליסט "${name}".`});
    });
  });

  deletePlaylistBtn.addEventListener("click", ()=>{
    const pl = getActive();
    if(!pl){
      toast({title:"אין פלייליסט", message:"אין מה למחוק."});
      return;
    }
    const ok = confirm(`למחוק את הפלייליסט "${pl.name}"? פעולה זו בלתי הפיכה.`);
    if(!ok) return;

    playlists = playlists.filter(p => p.id !== pl.id);
    persist();

    if(playlists.length){
      activeId = playlists[0].id;
      S.qsSet({ pid: activeId });
    }else{
      activeId = null;
      S.qsSet({ pid: "" });
    }
    renderSidebar();
    renderMain();
    toast({title:"נמחק", message:"הפלייליסט נמחק."});
  });

  playPlaylistBtn.addEventListener("click", ()=>{
    const pl = getActive();
    if(!pl || !(pl.items||[]).length){
      toast({title:"אין מה לנגן", message:"בחר פלייליסט עם פריטים."});
      return;
    }
    const arr = sortedFilteredItems(pl.items || []).filter(x => x.type === "youtube");
    if(arr.length === 0){
      toast({title:"אין סרטוני YouTube", message:"בפלייליסט זה אין סרטוני YouTube לניגון."});
      return;
    }
    let idx = 0;

    const render = ()=>{
      const it = arr[idx];
      openModal({
        title: `נגן פלייליסט: ${pl.name} (${idx+1}/${arr.length})`,
        bodyHtml: `
          <iframe class="player" src="https://www.youtube.com/embed/${encodeURIComponent(it.videoId)}?autoplay=1"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen></iframe>
          <div style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap;">
            <button class="btn secondary" id="prevBtn" type="button">⟵ קודם</button>
            <button class="btn" id="nextBtn" type="button">הבא ⟶</button>
          </div>
        `
      });

      const prev = document.getElementById("prevBtn");
      const next = document.getElementById("nextBtn");
      prev.disabled = idx === 0;
      next.disabled = idx === arr.length - 1;

      prev.addEventListener("click", ()=>{
        if(idx > 0){ idx--; render(); }
      });
      next.addEventListener("click", ()=>{
        if(idx < arr.length - 1){ idx++; render(); }
      });
    };

    render();
  });

  filterInput.addEventListener("input", ()=> renderMain());
  sortSelect.addEventListener("change", ()=> renderMain());

  load();
})();
