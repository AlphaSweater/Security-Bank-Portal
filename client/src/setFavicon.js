// Dynamically set favicon using Vite-imported asset
// This ensures correct asset path in dev and production builds
import sbpLogoUrl from "./assets/sbpLogo.png";

export function setFavicon(href = sbpLogoUrl) {
  const doc = document;
  let link = doc.querySelector("link[rel='icon']");
  if (!link) {
    link = doc.createElement("link");
    link.rel = "icon";
    doc.head.appendChild(link);
  }
  link.type = "image/png";
  link.href = href;
}

// Auto-run on import
if (typeof document !== "undefined") {
  setFavicon();
}
