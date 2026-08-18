(() => {
  "use strict";

  const code = (location.pathname.match(/\/r\/([BDGP]\d{2})(?:\/|$)/i) || [])[1]?.toUpperCase();

  function chunkUrl(recipeCode) {
    if (!recipeCode) return null;
    const prefix = recipeCode[0];
    const n = Number(recipeCode.slice(1));
    const max = prefix === "B" ? 46 : 24;
    if (!["B", "D", "G", "P"].includes(prefix) || n < 1 || n > max) return null;
    const start = Math.floor((n - 1) / 8) * 8 + 1;
    const end = Math.min(start + 7, max);
    const pad = value => String(value).padStart(2, "0");
    return `/data/recipes-${prefix}${pad(start)}-${prefix}${pad(end)}.json`;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function nlNumber(value) {
    if (Number.isInteger(value)) return String(value);
    return String(value).replace(".", ",");
  }

  const plurals = {
    "blikje": "blikjes",
    "bol": "bollen",
    "handje": "handjes",
    "plak": "plakken",
    "plakje": "plakjes",
    "rol": "rollen",
    "sneetje": "sneetjes",
    "stengel": "stengels",
    "teentje": "teentjes",
    "zak": "zakken",
    "zakje": "zakjes"
  };

  function amountText(row) {
    const [, quantity, unit] = row;
    if (quantity == null) return "naar smaak";
    const q = Number(quantity);
    let u = unit || "";
    if (q !== 1 && plurals[u]) u = plurals[u];
    return `${nlNumber(q)}${u ? " " + u : ""}`;
  }

  function ingredientHtml(row) {
    const [name, , , info, alternative, pantry] = row;
    const notes = [];
    if (info) notes.push(`<span class="note">${escapeHtml(info)}</span>`);
    if (alternative) notes.push(`<span class="note">Alternatief: ${escapeHtml(alternative)}</span>`);
    if (pantry) notes.push('<span class="pantry">Uit de voorraadkast</span>');
    return `<li><span class="amount">${escapeHtml(amountText(row))}</span><span><span class="ingredient-name">${escapeHtml(name)}</span>${notes.join("")}</span></li>`;
  }

  function render(recipe) {
    document.title = `${recipe.n} – Wat eten we vandaag?`;
    document.getElementById("recipe-code").textContent = recipe.c;
    document.getElementById("recipe-set").textContent = recipe.s;
    document.getElementById("recipe-title").textContent = recipe.n;
    document.getElementById("recipe-time").textContent = `⏱ ${recipe.t} minuten`;
    document.getElementById("ingredients").innerHTML = recipe.i.map(ingredientHtml).join("");
    document.getElementById("steps").innerHTML = recipe.b.map(step => `<li>${escapeHtml(step)}</li>`).join("");

    const tip = document.getElementById("tip");
    if (recipe.p) {
      document.getElementById("tip-text").textContent = recipe.p;
      tip.hidden = false;
    } else {
      tip.hidden = true;
    }

    document.getElementById("recipe-footer").textContent =
      `Recept ${recipe.c} · Wat eten we vandaag? · Plumae Kaartspellen`;
  }

  function showError() {
    document.getElementById("recipe-root").innerHTML =
      '<div class="load-error">Dit recept kon niet worden geladen. Controleer de receptcode en probeer het opnieuw.</div>';
  }

  const url = chunkUrl(code);
  if (!url) {
    showError();
    return;
  }

  fetch(url, { cache: "no-cache" })
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(list => {
      const recipe = list.find(item => item.c === code);
      if (!recipe) throw new Error("Recipe not found");
      render(recipe);
    })
    .catch(showError);
})();
