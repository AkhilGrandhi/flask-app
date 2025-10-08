const $base = document.getElementById("backendBase");
const $btn  = document.getElementById("save");
const $msg  = document.getElementById("msg");

$btn.addEventListener("click", async () => {
  const backendBase = $base.value.trim().replace(/\/+$/, "");
  if (!backendBase) { $msg.textContent = "Enter a URL."; return; }
  await chrome.storage.sync.set({ backendBase });
  $msg.textContent = "Saved.";
  console.log("[options] saved backendBase:", backendBase);
});

(async function init(){
  const { backendBase } = await chrome.storage.sync.get(["backendBase"]);
  $base.value = backendBase || "http://localhost:5000";
  console.log("[options] current backendBase:", $base.value);
})();
