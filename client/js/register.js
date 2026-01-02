(function(){
  const { mountHeader, toast } = window.UI;
  const { getUsers, setUsers, normalizeText } = window.StorageUtil;

  mountHeader("");

  const form = document.getElementById("registerForm");
  const msg = document.getElementById("msg");

  function showError(text){
    msg.innerHTML = `<div class="error">${text}</div>`;
  }
  function clearMsg(){ msg.innerHTML = ""; }

  function passwordOk(pw){
    if(pw.length < 6) return false;
    const hasLetter = /[A-Za-zא-ת]/.test(pw);
    const hasDigit = /\d/.test(pw);
    const hasSpecial = /[^A-Za-zא-ת0-9]/.test(pw);
    return hasLetter && hasDigit && hasSpecial;
  }

  form.addEventListener("submit", (e)=>{
    e.preventDefault();
    clearMsg();

    const username = normalizeText(document.getElementById("username").value);
    const firstName = normalizeText(document.getElementById("firstName").value);
    const password = document.getElementById("password").value || "";
    const password2 = document.getElementById("password2").value || "";
    const imageUrl = normalizeText(document.getElementById("imageUrl").value);

    if(!username || !firstName || !password || !password2){
      showError("כל השדות המסומנים ב-* הם חובה.");
      return;
    }

    const users = getUsers();
    const exists = users.some(u => u.username.toLowerCase() === username.toLowerCase());
    if(exists){
      showError("שם משתמש כבר קיים. בחר/י שם אחר.");
      return;
    }

    if(!passwordOk(password)){
      showError("הסיסמה לא עומדת בדרישות: מינימום 6 תווים, לפחות אות אחת, מספר אחד ותו מיוחד אחד.");
      return;
    }

    if(password !== password2){
      showError("אימות סיסמה נכשל – הסיסמאות אינן זהות.");
      return;
    }

    const user = { username, firstName, password, imageUrl };
    users.push(user);
    setUsers(users);

    toast({ title:"נרשמת בהצלחה", message:"כעת ניתן להתחבר.", actionLabel:"עבור להתחברות", actionHref:`login.html?u=${encodeURIComponent(username)}` });
    setTimeout(()=> location.href = `login.html?u=${encodeURIComponent(username)}`, 400);
  });
})();
