import { buildUrl, endpoints, getJson } from "./api.js";
import { createDateInput, createSelect, createSubmit, renderResults, setStatus, showAlert } from "./render.js";
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
  sortAsc: true
};

const filtersForm = document.getElementById("filtersForm");
const quickSearch = document.getElementById("quickSearch");
const sortPrice = document.getElementById("sortPrice");
const lastUrl = document.getElementById("lastUrl");
const copyUrl = document.getElementById("copyUrl");
const themeToggle = document.getElementById("themeToggle");

init();

async function init() {
  bindEvents();
  restoreTheme();
  await loadInitialData();
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
    });
  });

  filtersForm.addEventListener("submit", handleSubmit);

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
      createSubmit("Buscar estaciones")
    );
    setDefaultOption("ccaa", "CASTILLA Y LEÓN");
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
        placeholder: "Toda la provincia"
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
    ccaa: "Estaciones de servicio por comunidad",
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

async function handleSubmit(event) {
  event.preventDefault();
  showAlert("");
  setStatus("Consultando", "loading");

  try {
    let endpoint = "";
    state.selectedProductName = getSelectedText("producto");

    if (state.view === "ccaa") {
      const idCCAA = document.getElementById("ccaa").value;
      endpoint = endpoints.estacionesPorCCAA(idCCAA);
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
