(function(){
  const { mountHeader, toast } = window.UI;
  const { loadJSON, saveJSON } = window.StorageUtil;

  mountHeader("index.html");

  const STUDENT_KEY = "student_meta_v1";

  function setLinks(githubUrl, liveUrl){
    const g = document.getElementById("githubLink");
    const l = document.getElementById("liveLink");
    g.href = githubUrl || "#";
    l.href = liveUrl || "#";
    g.classList.toggle("disabled", !githubUrl);
    l.classList.toggle("disabled", !liveUrl);
  }

  function load(){
    const data = loadJSON(STUDENT_KEY, {
      studentName: "מהדי אבו ליל",
      studentId: "212192603",
      githubUrl: "",
      liveUrl: ""
    });

    document.getElementById("studentName").value = data.studentName || "";
    document.getElementById("studentId").value = data.studentId || "";
    document.getElementById("githubUrl").value = data.githubUrl || "";
    document.getElementById("liveUrl").value = data.liveUrl || "";

    setLinks(data.githubUrl, data.liveUrl);
  }

  document.getElementById("saveStudentBtn").addEventListener("click", ()=>{
    const data = loadJSON(STUDENT_KEY, {});
    data.studentName = document.getElementById("studentName").value.trim();
    data.studentId = document.getElementById("studentId").value.trim();
    saveJSON(STUDENT_KEY, data);
    toast({title:"נשמר", message:"פרטי הסטודנט נשמרו בהצלחה."});
  });

  document.getElementById("saveLinksBtn").addEventListener("click", ()=>{
    const data = loadJSON(STUDENT_KEY, {});
    data.githubUrl = document.getElementById("githubUrl").value.trim();
    data.liveUrl = document.getElementById("liveUrl").value.trim();
    saveJSON(STUDENT_KEY, data);
    setLinks(data.githubUrl, data.liveUrl);
    toast({title:"נשמר", message:"הקישורים נשמרו בהצלחה."});
  });

  load();
})();
