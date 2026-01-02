// Simple wrapper around server APIs (used when you run the Node.js server).
// The static client version (Part A) uses only LocalStorage/SessionStorage.

export async function apiGet(path){
  const res = await fetch(path, { credentials: "include" });
  if(!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiPost(path, body){
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify(body || {}),
    credentials: "include"
  });
  if(!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiDelete(path){
  const res = await fetch(path, { method:"DELETE", credentials:"include" });
  if(!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiPut(path, body){
  const res = await fetch(path, {
    method:"PUT",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify(body || {}),
    credentials:"include"
  });
  if(!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiUploadMp3(file, playlistId){
  const fd = new FormData();
  fd.append("file", file);
  fd.append("playlistId", playlistId);

  const res = await fetch("/api/upload", {
    method:"POST",
    body: fd,
    credentials:"include"
  });
  if(!res.ok) throw new Error(await res.text());
  return res.json();
}
