// ===== UI helpers (no modules) =====
window.UI = (function(){
  function mountHeader(active=""){
    const u = window.StorageUtil.getCurrentUser();

    const nav = [
      ["index.html", "דף ראשי"],
      ["search.html", "חיפוש"],
      ["playlists.html", "פלייליסטים"],
    ];

    const navHtml = nav.map(([href,label]) => {
      const cls = href === active ? 'style="border-color: rgba(122,162,255,0.55); background: rgba(122,162,255,0.14);"' : "";
      return `<a ${cls} href="${href}">${label}</a>`;
    }).join("");

    const userHtml = u ? `
      <div class="userbox">
        <img src="${u.imageUrl || "assets/avatar.svg"}" alt="user"/>
        <div class="meta">
          <strong>${u.firstName ? `שלום ${u.firstName}` : `שלום ${u.username}`}</strong>
          <small>${u.username}</small>
        </div>
        <button class="btn secondary" id="logoutBtn" type="button">התנתק</button>
      </div>
    ` : `
      <div class="userbox">
        <img src="assets/avatar.svg" alt="guest"/>
        <div class="meta">
          <strong>אורח</strong>
          <small>לא מחובר</small>
        </div>
        <a class="btn secondary" href="login.html">התחברות</a>
      </div>
    `;

    const html = `
      <div class="topbar">
        <div class="topbar-inner">
          <div class="brand"><span class="dot"></span><span>WEB • CLIENT</span></div>
          <div class="nav">${navHtml}</div>
          ${userHtml}
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("afterbegin", html);

    const logoutBtn = document.getElementById("logoutBtn");
    if(logoutBtn){
      logoutBtn.addEventListener("click", () => {
        window.StorageUtil.clearCurrentUser();
        location.href = "login.html";
      });
    }
  }

  function mountToasts(){
    if(document.getElementById("toastWrap")) return;
    const wrap = document.createElement("div");
    wrap.className = "toast-wrap";
    wrap.id = "toastWrap";
    document.body.appendChild(wrap);
  }

  function toast({title, message, actionLabel, actionHref, timeoutMs=4500}){
    mountToasts();
    const wrap = document.getElementById("toastWrap");
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `
      <div>
        <strong>${title || "הודעה"}</strong>
        <small>${message || ""}</small>
        ${actionHref ? `<div style="margin-top:8px"><a href="${actionHref}">${actionLabel || "פתח"}</a></div>` : ""}
      </div>
      <div class="x" title="סגור">✕</div>
    `;
    const x = el.querySelector(".x");
    x.addEventListener("click", ()=> el.remove());
    wrap.appendChild(el);
    setTimeout(()=> el.remove(), timeoutMs);
  }

  function openModal({title, bodyHtml}){
    let bd = document.getElementById("modalBackdrop");
    if(!bd){
      bd = document.createElement("div");
      bd.id = "modalBackdrop";
      bd.className = "modal-backdrop";
      bd.innerHTML = `
        <div class="modal" role="dialog" aria-modal="true">
          <div class="modal-header">
            <strong id="modalTitle"></strong>
            <button class="modal-close" id="modalCloseBtn" type="button">סגור</button>
          </div>
          <div class="modal-body" id="modalBody"></div>
        </div>
      `;
      document.body.appendChild(bd);

      const close = ()=> closeModal();
      bd.addEventListener("click", (e)=>{ if(e.target === bd) close(); });
      bd.querySelector("#modalCloseBtn").addEventListener("click", close);
      document.addEventListener("keydown", (e)=>{
        if(e.key === "Escape" && bd.style.display === "flex") close();
      });
    }
    bd.querySelector("#modalTitle").textContent = title || "";
    bd.querySelector("#modalBody").innerHTML = bodyHtml || "";
    bd.style.display = "flex";
  }

  function closeModal(){
    const bd = document.getElementById("modalBackdrop");
    if(!bd) return;
    bd.style.display = "none";
    const ifr = bd.querySelector("iframe");
    if(ifr) ifr.src = "about:blank";
  }

  return { mountHeader, toast, openModal, closeModal };
})();
