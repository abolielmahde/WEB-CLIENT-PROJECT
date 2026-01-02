(function(){
  const { mountHeader, toast } = window.UI;
  const { getUsers, setCurrentUser, qsGet } = window.StorageUtil;

  mountHeader("");

  const msg = document.getElementById("msg");
  const form = document.getElementById("loginForm");

  function showError(text){
    msg.innerHTML = `<div class="error">${text}</div>`;
  }
  function clearMsg(){ msg.innerHTML = ""; }

  const presetU = qsGet("u");
  if(presetU) document.getElementById("username").value = presetU;

  form.addEventListener("submit", (e)=>{
    e.preventDefault();
    clearMsg();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    if(!username || !password){
      showError("שם משתמש וסיסמה הם שדות חובה.");
      return;
    }

    const users = getUsers();
    const found = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    if(!found){
      showError("שם משתמש או סיסמה שגויים.");
      return;
    }

    const currentUser = { username: found.username, firstName: found.firstName, imageUrl: found.imageUrl || "" };
    setCurrentUser(currentUser);

    toast({title:"התחברת!", message:`ברוך הבא ${currentUser.firstName || currentUser.username}`});

    const next = qsGet("next");
    setTimeout(()=> {
      location.href = next ? decodeURIComponent(next) : "search.html";
    }, 350);
  });
})();
