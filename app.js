// IF Real Estate PWA – registro y suscripción Web Push
// VAPID public key (segura para exponer; la privada vive en GitHub Actions)
const VAPID_PUBLIC_KEY = "BLJDaRvppm0huMZsl20L8u6-vmyYqUfdyMELALNQbOCe5yrAxVjke-e9bGjNPG1SIB2MWUMSzXxTyabaIN-e1DI";

const $ = (sel) => document.querySelector(sel);
const status = $("#status-text");
const btnEnable = $("#btn-enable");
const subOut = $("#subscription-output");
const subText = $("#subscription-text");
const btnCopy = $("#btn-copy");
const installBanner = $("#install-banner");

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map(c => c.charCodeAt(0)));
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches
      || window.navigator.standalone === true;
}

function setStatus(text, ok = false) {
  status.textContent = text;
  status.style.color = ok ? "#4ade80" : "#a8a8a8";
}

async function init() {
  // Si está abierto en Safari (no instalado), avisar para que instale
  if (!isStandalone() && /iPhone|iPad/.test(navigator.userAgent)) {
    installBanner.classList.remove("hidden");
  }

  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    setStatus("Tu navegador no soporta notificaciones push.");
    return;
  }

  try {
    const reg = await navigator.serviceWorker.register("./sw.js");
    await navigator.serviceWorker.ready;

    // ¿Ya está suscrito?
    const existing = await reg.pushManager.getSubscription();
    if (existing) {
      setStatus("✅ Notificaciones activas. Ya estás suscrito.", true);
      showSubscription(existing);
      return;
    }

    // Permiso pendiente
    if (Notification.permission === "denied") {
      setStatus("❌ Permiso denegado. Actívalo en Ajustes iOS → IF Real Estate → Notificaciones.");
      return;
    }

    setStatus("Pulsa el botón para activar las notificaciones.");
    btnEnable.classList.remove("hidden");
    btnEnable.addEventListener("click", subscribe);
  } catch (err) {
    setStatus("Error al inicializar: " + err.message);
    console.error(err);
  }
}

async function subscribe() {
  btnEnable.disabled = true;
  setStatus("Solicitando permiso…");
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setStatus("❌ Permiso denegado.");
      btnEnable.disabled = false;
      return;
    }
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    setStatus("✅ Suscripción creada. Copia la clave y envíasela al admin.", true);
    btnEnable.classList.add("hidden");
    showSubscription(sub);
  } catch (err) {
    setStatus("Error: " + err.message);
    btnEnable.disabled = false;
    console.error(err);
  }
}

function showSubscription(sub) {
  subOut.classList.remove("hidden");
  subText.value = JSON.stringify(sub.toJSON(), null, 2);
}

btnCopy.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(subText.value);
    btnCopy.textContent = "✅ Copiado";
    setTimeout(() => (btnCopy.textContent = "Copiar al portapapeles"), 2000);
  } catch {
    subText.select();
    document.execCommand("copy");
  }
});

init();
