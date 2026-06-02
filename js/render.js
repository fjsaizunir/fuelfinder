import { findPriceForProduct } from "./utils.js";

export function setStatus(text, type = "") {
  const badge = document.getElementById("statusBadge");
  badge.textContent = text;
  badge.className = `status-badge ${type}`.trim();
}

export function showAlert(message, type = "") {
  const alerts = document.getElementById("alerts");
  alerts.innerHTML = message ? `<div class="alert ${type}">${message}</div>` : "";
}

export function createSelect({ id, label, options, valueKey, textKey, placeholder = "Selecciona una opción", required = true }) {
  const wrapper = document.createElement("label");
  wrapper.className = "field";
  wrapper.htmlFor = id;

  const span = document.createElement("span");
  span.textContent = label;

  const select = document.createElement("select");
  select.id = id;
  select.name = id;
  select.required = required;

  const first = document.createElement("option");
  first.value = "";
  first.textContent = placeholder;
  select.appendChild(first);

  options.forEach((option) => {
    const opt = document.createElement("option");
    opt.value = typeof valueKey === "function" ? valueKey(option) : option[valueKey];
    opt.textContent = typeof textKey === "function" ? textKey(option) : option[textKey];
    select.appendChild(opt);
  });

  wrapper.append(span, select);
  return wrapper;
}

export function createDateInput({ id, label, defaultValue }) {
  const wrapper = document.createElement("label");
  wrapper.className = "field";
  wrapper.htmlFor = id;

  const span = document.createElement("span");
  span.textContent = label;

  const input = document.createElement("input");
  input.id = id;
  input.name = id;
  input.type = "date";
  input.required = true;
  input.value = defaultValue || "";

  wrapper.append(span, input);
  return wrapper;
}

export function createCheckbox({ id, label }) {
  const wrapper = document.createElement("label");
  wrapper.className = "field checkbox-field";
  wrapper.htmlFor = id;

  const span = document.createElement("span");
  span.textContent = label;

  const input = document.createElement("input");
  input.id = id;
  input.name = id;
  input.type = "checkbox";

  wrapper.append(span, input);
  return wrapper;
}

export function createSubmit(text = "Buscar") {
  const button = document.createElement("button");
  button.type = "submit";
  button.className = "primary-button";
  button.textContent = text;
  return button;
}

export function createLocationButton(text = "Usar mi ubicación") {
  const wrapper = document.createElement("div");
  wrapper.className = "field location-field";

  const span = document.createElement("span");
  span.textContent = "Ubicación";

  const button = document.createElement("button");
  button.id = "useLocation";
  button.type = "button";
  button.className = "location-button";
  button.innerHTML = `<span aria-hidden="true">📍</span><span>${text}</span>`;

  const note = document.createElement("small");
  note.className = "field-note";
  note.textContent = "Solo se usa para seleccionar la comunidad autónoma.";

  wrapper.append(span, button, note);
  return wrapper;
}

export function renderResults(items, { mode, productName = "" } = {}) {
  const results = document.getElementById("results");
  const resultCount = document.getElementById("resultCount");

  results.innerHTML = "";
  resultCount.textContent = `${items.length} resultado${items.length === 1 ? "" : "s"} encontrado${items.length === 1 ? "" : "s"}.`;

  if (!items.length) {
    results.innerHTML = `<div class="alert">No hay resultados para los filtros seleccionados.</div>`;
    return;
  }

  const fragment = document.createDocumentFragment();

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "result-card";

    const rotulo = item.Rótulo || item.Rotulo || item.Nombre || item.NombreInstalacion || item["Rótulo"] || "Estación sin rótulo";
    const municipio = item.Municipio || item.Localidad || item["Municipio"] || "Municipio no disponible";
    const provincia = item.Provincia || item["Provincia"] || "Provincia no disponible";
    const direccion = item.Dirección || item.Direccion || item["Dirección"] || "Dirección no disponible";
    const horario = item.Horario || item["Horario"] || "Horario no disponible";
    const cp = item["C.P."] || item.CP || "";
    const precio = findPriceForProduct(item, productName);

    const showPrice = mode === "historico" || mode === "maritimos" || precio.value !== null;

    card.innerHTML = `
      <div class="result-header">
        <h3>${escapeHtml(rotulo)}</h3>
        ${showPrice ? `<div class="price">${escapeHtml(precio.label)}</div>` : ""}
      </div>
      <ul class="meta-list">
        <li>📍 ${escapeHtml(direccion)} ${cp ? `· ${escapeHtml(cp)}` : ""}</li>
        <li>🏙️ ${escapeHtml(municipio)} · ${escapeHtml(provincia)}</li>
        <li>🕒 ${escapeHtml(horario)}</li>
      </ul>
      <div class="chip-row">
        ${productName ? `<span class="chip">${escapeHtml(productName)}</span>` : ""}
        ${item.Latitud && item.Longitud ? `<span class="chip">GPS disponible</span>` : ""}
      </div>
    `;

    fragment.appendChild(card);
  });

  results.appendChild(fragment);
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
