import { buildUrl, endpoints, getJson } from "./api.js";
import { createDateInput, createLocationButton, createSelect, createSubmit, renderResults, setStatus, showAlert } from "./render.js";
import { findPriceForProduct, formatSpanishDateForApi, getMunicipalityId, getProductId, getProvinceId, normalizeApiList, parseSpanishNumber, textIncludes, uniqueBy } from "./utils.js";

const state = {
  view: "ccaa",
  comunidades: [],
  provincias: [],
  productos: [],
  municipios: [],
  results: [],
  filteredResults: [],
  lastEndpoint: "",
  selectedProductName: "",
  sortAsc: true,
  detectedCCAA: localStorage.getItem("fuelfinder-detected-ccaa") || "",
  locationRequested: localStorage.getItem("fuelfinder-location-requested") === "true"
};

const filtersForm = document.getElementById("filtersForm");
const quickSearch = document.getElementById("quickSearch");
const sortPrice = document.getElementById("sortPrice");
const lastUrl = document.getElementById("lastUrl");
const copyUrl = document.getElementById("copyUrl");
const themeToggle = document.getElementById("themeToggle");
const installAppBtn = document.getElementById("installAppBtn");
const installHelp = document.getElementById("installHelp");
const closeInstallHelp = document.getElementById("closeInstallHelp");

let deferredInstallPrompt = null;

init();

async function init() {
  bindEvents();
  restoreTheme();
  initPwa();
  await loadInitialData();
  await detectLocationSilentlyIfPermissionGranted();
  renderForm();
}

function bindEvents() {
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.view;
      state.results = [];
      state.filteredResults = [];
      state.selectedProductName = "";
      quickSearch.value = "";
      document.querySelectorAll(".tab-button").forEach((tab) => tab.classList.remove("active"));
      button.classList.add("active");
      renderForm();
      renderResults([], { mode: state.view });
      document.getElementById("resultCount").textContent = "Configura los filtros y pulsa buscar.";
      showAlert("");
      scrollToFiltersOnMobile();
    });
  });

  filtersForm.addEventListener("submit", handleSubmit);

  filtersForm.addEventListener("click", async (event) => {
    if (event.target.closest("#useLocation")) {
      await detectAndApplyLocation({ userInitiated: true });
    }
  });

  filtersForm.addEventListener("change", async (event) => {
    if (event.target.id === "provincia" && state.view === "historico") {
      await updateMunicipios(event.target.value);
    }
  });

  quickSearch.addEventListener("input", applyClientFilters);
  sortPrice.addEventListener("click", () => {
    state.sortAsc = !state.sortAsc;
    sortPrice.textContent = state.sortAsc ? "Ordenar por precio" : "Precio descendente";
    applyClientFilters();
  });

  copyUrl.addEventListener("click", async () => {
    if (!state.lastEndpoint) return;
    try {
      await navigator.clipboard.writeText(buildUrl(state.lastEndpoint));
      copyUrl.textContent = "Copiada";
      setTimeout(() => (copyUrl.textContent = "Copiar URL"), 1300);
    } catch {
      showAlert("No se pudo copiar automáticamente. Puedes seleccionar la URL manualmente.", "error");
    }
  });

  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const enabled = document.body.classList.contains("dark");
    localStorage.setItem("fuelfinder-theme", enabled ? "dark" : "light");
    themeToggle.textContent = enabled ? "☀" : "☾";
  });

  installAppBtn?.addEventListener("click", handleInstallClick);
  closeInstallHelp?.addEventListener("click", () => installHelp.hidden = true);
  installHelp?.addEventListener("click", (event) => {
    if (event.target === installHelp) installHelp.hidden = true;
  });
}


async function detectLocationSilentlyIfPermissionGranted() {
  if (state.detectedCCAA || !isMobileDevice() || !("geolocation" in navigator)) return;

  try {
    if (!("permissions" in navigator)) return;
    const permission = await navigator.permissions.query({ name: "geolocation" });
    if (permission.state === "granted") {
      await detectAndApplyLocation({ userInitiated: false, silent: true });
    }
  } catch {
    // Si el navegador no permite consultar permisos, no se solicita ubicación automáticamente.
  }
}

function initPwa() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js").catch(() => {
        // La aplicación sigue funcionando aunque el navegador no registre el service worker.
      });
    });
  }

  if (!isMobileDevice() || isRunningStandalone()) {
    return;
  }

  const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    document.body.classList.add("mobile-install-available");
    installAppBtn.hidden = false;
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    installAppBtn.hidden = true;
    document.body.classList.remove("mobile-install-available");
  });

  if (isiOS) {
    document.body.classList.add("mobile-install-available");
    installAppBtn.hidden = false;
  }
}

async function handleInstallClick() {
  if (!isMobileDevice()) return;

  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installAppBtn.hidden = true;
    document.body.classList.remove("mobile-install-available");
    return;
  }

  installHelp.hidden = false;
}

function isMobileDevice() {
  return window.matchMedia("(max-width: 759px)").matches || /android|iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isRunningStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}


function scrollToFiltersOnMobile() {
  if (window.innerWidth > 759) return;

  const panel = document.querySelector(".filters-panel");
  if (!panel) return;

  window.setTimeout(() => {
    panel.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }, 120);
}

function restoreTheme() {
  const theme = localStorage.getItem("fuelfinder-theme");
  if (theme === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "☀";
  }
}

async function loadInitialData() {
  setStatus("Cargando", "loading");
  showAlert("Cargando listados oficiales de comunidades, provincias y productos...");

  try {
    const [comunidades, provincias, productos] = await Promise.all([
      getJson(endpoints.comunidades()),
      getJson(endpoints.provincias()),
      getJson(endpoints.productos())
    ]);

    state.comunidades = normalizeApiList(comunidades).sort((a, b) => String(a.CCAA).localeCompare(String(b.CCAA), "es"));
    state.provincias = normalizeApiList(provincias).sort((a, b) => String(a.Provincia).localeCompare(String(b.Provincia), "es"));
    state.productos = normalizeApiList(productos).sort((a, b) => String(a.NombreProducto).localeCompare(String(b.NombreProducto), "es"));

    setStatus("Listo", "ok");
    showAlert("");
  } catch (error) {
    setStatus("Error", "error");
    showAlert(`No se pudieron cargar los listados iniciales. Si abres el archivo directamente con doble clic, prueba a ejecutarlo con un servidor local. Detalle: ${error.message}`, "error");
  }
}

function renderForm() {
  filtersForm.innerHTML = "";
  document.getElementById("filterTitle").textContent = getTitleForView();

  if (state.view === "ccaa") {
    filtersForm.append(
      createSelect({
        id: "ccaa",
        label: "Comunidad Autónoma",
        options: state.comunidades,
        valueKey: "IDCCAA",
        textKey: "CCAA",
        placeholder: "Selecciona una comunidad"
      }),
      createSelect({
        id: "producto",
        label: "Carburante",
        options: state.productos,
        valueKey: getProductId,
        textKey: "NombreProducto",
        placeholder: "Selecciona un carburante"
      }),
      createLocationButton(state.detectedCCAA ? `Ubicación: ${state.detectedCCAA}` : "Usar mi ubicación"),
      createSubmit("Buscar estaciones")
    );
    setDefaultOption("ccaa", state.detectedCCAA || "CASTILLA Y LEÓN");
    setDefaultProduct("Gasolina 95 E5");
  }

  if (state.view === "maritimos") {
    filtersForm.append(
      createSelect({
        id: "provincia",
        label: "Provincia",
        options: state.provincias,
        valueKey: getProvinceId,
        textKey: "Provincia",
        placeholder: "Selecciona una provincia"
      }),
      createSelect({
        id: "producto",
        label: "Carburante",
        options: state.productos,
        valueKey: getProductId,
        textKey: "NombreProducto",
        placeholder: "Selecciona un carburante"
      }),
      createSubmit("Buscar postes")
    );
    setDefaultOption("provincia", "CASTELLÓN");
    setDefaultProduct("Gasolina 95 E5");
  }

  if (state.view === "historico") {
    filtersForm.append(
      createSelect({
        id: "provincia",
        label: "Provincia",
        options: state.provincias,
        valueKey: getProvinceId,
        textKey: "Provincia",
        placeholder: "Selecciona una provincia"
      }),
      createDateInput({
        id: "fecha",
        label: "Fecha",
        defaultValue: "2026-02-12"
      }),
      createSelect({
        id: "producto",
        label: "Carburante",
        options: state.productos,
        valueKey: getProductId,
        textKey: "NombreProducto",
        placeholder: "Selecciona un carburante"
      }),
      createSelect({
        id: "municipio",
        label: "Municipio opcional",
        options: [],
        valueKey: getMunicipalityId,
        textKey: "Municipio",
        placeholder: "Toda la provincia",
        required: false
      }),
      createSubmit("Consultar precios")
    );
    setDefaultOption("provincia", "GRANADA");
    setDefaultProduct("Gasolina 95 E5");
    updateMunicipios(document.getElementById("provincia")?.value);
  }
}

function getTitleForView() {
  return {
    ccaa: "Estaciones de servicio por comunidad y carburante",
    maritimos: "Postes marítimos por provincia y producto",
    historico: "Precios por provincia, fecha y carburante"
  }[state.view];
}

function setDefaultOption(selectId, text) {
  const select = document.getElementById(selectId);
  if (!select) return;
  const target = [...select.options].find((option) => option.textContent.toUpperCase().includes(text.toUpperCase()));
  if (target) select.value = target.value;
}

function setDefaultProduct(productName) {
  const select = document.getElementById("producto");
  if (!select) return;
  const target = [...select.options].find((option) => option.textContent.toLowerCase().includes(productName.toLowerCase()));
  if (target) select.value = target.value;
}

async function updateMunicipios(idProvincia) {
  const municipioSelect = document.getElementById("municipio");
  if (!municipioSelect || !idProvincia) return;

  municipioSelect.innerHTML = `<option value="">Toda la provincia</option>`;

  try {
    const data = await getJson(endpoints.municipiosPorProvincia(idProvincia));
    state.municipios = normalizeApiList(data).sort((a, b) => String(a.Municipio).localeCompare(String(b.Municipio), "es"));

    state.municipios.forEach((municipio) => {
      const option = document.createElement("option");
      option.value = getMunicipalityId(municipio);
      option.textContent = municipio.Municipio;
      municipioSelect.appendChild(option);
    });

    const cullar = [...municipioSelect.options].find((option) => option.textContent.toUpperCase() === "CÚLLAR" || option.textContent.toUpperCase() === "CULLAR");
    if (cullar) municipioSelect.value = cullar.value;
  } catch {
    showAlert("No se pudieron cargar los municipios de la provincia seleccionada. La búsqueda por provincia seguirá funcionando.", "error");
  }
}


async function detectAndApplyLocation({ userInitiated = false, silent = false } = {}) {
  if (!("geolocation" in navigator)) {
    if (!silent) showAlert("Tu navegador no permite consultar la ubicación del dispositivo.", "error");
    return;
  }

  const button = document.getElementById("useLocation");
  const previousText = button?.innerHTML;
  if (button) {
    button.disabled = true;
    button.innerHTML = `<span aria-hidden="true">⌛</span><span>Detectando...</span>`;
  }

  if (userInitiated || !silent) {
    showAlert("El navegador te pedirá permiso para usar tu ubicación. Solo se usará para seleccionar la comunidad autónoma.");
  }

  try {
    localStorage.setItem("fuelfinder-location-requested", "true");
    state.locationRequested = true;

    const position = await getCurrentPosition();
    const ccaa = await getAutonomousCommunityFromCoordinates(position.coords.latitude, position.coords.longitude);

    if (!ccaa) {
      throw new Error("No se pudo determinar la comunidad autónoma a partir de la ubicación.");
    }

    state.detectedCCAA = ccaa;
    localStorage.setItem("fuelfinder-detected-ccaa", ccaa);

    const select = document.getElementById("ccaa");
    if (select) setDefaultOption("ccaa", ccaa);

    if (button) {
      button.innerHTML = `<span aria-hidden="true">✅</span><span>${ccaa}</span>`;
    }

    showAlert(`Comunidad autónoma detectada: ${ccaa}. Puedes cambiarla manualmente si lo necesitas.`);
  } catch (error) {
    if (button && previousText) button.innerHTML = previousText;
    if (!silent || userInitiated) {
      showAlert(`No se pudo usar la ubicación. Puedes seleccionar la comunidad manualmente. Detalle: ${error.message}`, "error");
    }
  } finally {
    if (button) button.disabled = false;
  }
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 9000,
      maximumAge: 1000 * 60 * 60
    });
  });
}

async function getAutonomousCommunityFromCoordinates(latitude, longitude) {
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&localityLanguage=es`;
  const response = await fetch(url, { headers: { "Accept": "application/json" } });

  if (!response.ok) {
    throw new Error(`El servicio de geolocalización ha devuelto el estado ${response.status}`);
  }

  const data = await response.json();
  const candidates = [
    data.principalSubdivision,
    data.localityInfo?.administrative?.find((item) => item.order === 4)?.name,
    data.localityInfo?.administrative?.find((item) => item.adminLevel === 4)?.name,
    data.localityInfo?.administrative?.map((item) => item.name).join(" ")
  ].filter(Boolean);

  for (const candidate of candidates) {
    const mapped = mapToApiCommunityName(candidate);
    if (mapped) return mapped;
  }

  return "";
}

function mapToApiCommunityName(value) {
  const normalized = normalizeText(value);
  const aliases = [
    ["ANDALUCIA", "ANDALUCÍA"],
    ["ARAGON", "ARAGÓN"],
    ["ASTURIAS", "PRINCIPADO DE ASTURIAS"],
    ["BALEARES", "ILLES BALEARS"],
    ["ILLES BALEARS", "ILLES BALEARS"],
    ["CANARIAS", "CANARIAS"],
    ["CANTABRIA", "CANTABRIA"],
    ["CASTILLA LA MANCHA", "CASTILLA LA MANCHA"],
    ["CASTILLA-LA MANCHA", "CASTILLA LA MANCHA"],
    ["CASTILLA Y LEON", "CASTILLA Y LEÓN"],
    ["CASTILE AND LEON", "CASTILLA Y LEÓN"],
    ["CATALUNA", "CATALUÑA"],
    ["CATALUNYA", "CATALUÑA"],
    ["CATALONIA", "CATALUÑA"],
    ["COMUNITAT VALENCIANA", "COMUNITAT VALENCIANA"],
    ["COMUNIDAD VALENCIANA", "COMUNITAT VALENCIANA"],
    ["VALENCIAN COMMUNITY", "COMUNITAT VALENCIANA"],
    ["EXTREMADURA", "EXTREMADURA"],
    ["GALICIA", "GALICIA"],
    ["MADRID", "COMUNIDAD DE MADRID"],
    ["MURCIA", "REGIÓN DE MURCIA"],
    ["NAVARRA", "COMUNIDAD FORAL DE NAVARRA"],
    ["PAIS VASCO", "PAÍS VASCO"],
    ["EUSKADI", "PAÍS VASCO"],
    ["BASQUE", "PAÍS VASCO"],
    ["LA RIOJA", "LA RIOJA"],
    ["CEUTA", "CEUTA"],
    ["MELILLA", "MELILLA"]
  ];

  const match = aliases.find(([alias]) => normalized.includes(alias));
  return match ? match[1] : "";
}

function normalizeText(value) {
  return String(value || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

async function handleSubmit(event) {
  event.preventDefault();
  showAlert("");
  setStatus("Consultando", "loading");

  try {
    let endpoint = "";
    state.selectedProductName = getSelectedText("producto");

    if (state.view === "ccaa") {
      const idCCAA = document.getElementById("ccaa").value;
      const idProducto = document.getElementById("producto").value;
      endpoint = endpoints.estacionesPorCCAAProducto(idCCAA, idProducto);
    }

    if (state.view === "maritimos") {
      const idProvincia = document.getElementById("provincia").value;
      const idProducto = document.getElementById("producto").value;
      endpoint = endpoints.postesProvinciaProducto(idProvincia, idProducto);
    }

    if (state.view === "historico") {
      const idProvincia = document.getElementById("provincia").value;
      const idMunicipio = document.getElementById("municipio")?.value;
      const idProducto = document.getElementById("producto").value;
      const fecha = formatSpanishDateForApi(document.getElementById("fecha").value);
      endpoint = idMunicipio
        ? endpoints.historicoMunicipioProducto(fecha, idMunicipio, idProducto)
        : endpoints.historicoProvinciaProducto(fecha, idProvincia, idProducto);
    }

    state.lastEndpoint = endpoint;
    lastUrl.textContent = buildUrl(endpoint);

    const data = await getJson(endpoint);
    const normalized = normalizeApiList(data);
    state.results = uniqueBy(normalized, (item) => `${item.IDEESS || ""}-${item.Rótulo || item.Rotulo || ""}-${item.Dirección || item.Direccion || ""}`);
    setStatus("Completado", "ok");
    applyClientFilters();
  } catch (error) {
    setStatus("Error", "error");
    showAlert(`No se pudo realizar la consulta. Revisa los filtros o la conexión con la API. Detalle: ${error.message}`, "error");
  }
}

function getSelectedText(selectId) {
  const select = document.getElementById(selectId);
  if (!select || select.selectedIndex < 0) return "";
  return select.options[select.selectedIndex]?.textContent || "";
}

function applyClientFilters() {
  const query = quickSearch.value;
  const productName = state.selectedProductName;

  state.filteredResults = state.results.filter((item) => textIncludes(item, query));

  state.filteredResults.sort((a, b) => {
    const pa = findPriceForProduct(a, productName).value;
    const pb = findPriceForProduct(b, productName).value;
    if (pa === null && pb === null) return 0;
    if (pa === null) return 1;
    if (pb === null) return -1;
    return state.sortAsc ? pa - pb : pb - pa;
  });

  renderResults(state.filteredResults, { mode: state.view, productName });
}
