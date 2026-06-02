export function normalizeApiList(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.ListaEESSPrecio)) return data.ListaEESSPrecio;
  if (Array.isArray(data.ListaEESSPrecioMar)) return data.ListaEESSPrecioMar;
  if (Array.isArray(data.ListaEstacionesTerrestres)) return data.ListaEstacionesTerrestres;
  return [];
}

export function getProvinceId(item) {
  return item.IDPovincia || item.IDProvincia || item.IdProvincia || item.idProvincia || "";
}

export function getProductId(item) {
  return item.IDProducto || item.IdProducto || item.idProducto || "";
}

export function getMunicipalityId(item) {
  return item.IDMunicipio || item.IdMunicipio || item.idMunicipio || "";
}

export function formatSpanishDateForApi(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${day}-${month}-${year}`;
}

export function parseSpanishNumber(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  const normalized = String(value).replace("€", "").replace(/\s/g, "").replace(",", ".");
  const num = Number.parseFloat(normalized);
  return Number.isFinite(num) ? num : null;
}

export function findPriceForProduct(item, productName = "") {
  const preferredKeys = [
    "PrecioProducto",
    "Precio",
    "PrecioProductoActual",
    "Precio Gasolina 95 E5",
    "Precio Gasoleo A",
    "Precio Gasóleo A",
    "Precio Gasolina 98 E5",
    "Precio Nuevo Gasoleo A",
    "Precio Nuevo Gasóleo A",
    "Precio Gasolina 95 E10",
    "Precio Gasolina 98 E10",
    "Precio Biodiesel",
    "Precio Bioetanol",
    "Precio Gases licuados del petróleo",
    "Precio Hidrogeno",
    "Precio Gas Natural Comprimido",
    "Precio Gas Natural Licuado"
  ];

  const normalizedProduct = productName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const productWords = normalizedProduct.split(/\s+/).filter(Boolean);

  const dynamicKeys = Object.keys(item).filter((key) => {
    const normalizedKey = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return normalizedKey.includes("precio") && productWords.every((word) => normalizedKey.includes(word));
  });

  const keys = [...dynamicKeys, ...preferredKeys, ...Object.keys(item).filter((key) => key.toLowerCase().includes("precio"))];

  for (const key of keys) {
    const raw = item[key];
    const parsed = parseSpanishNumber(raw);
    if (parsed !== null) {
      return { value: parsed, label: `${String(raw).trim()} €/L`, key };
    }
  }

  return { value: null, label: "Precio no disponible", key: "" };
}

export function textIncludes(item, query) {
  if (!query) return true;
  const haystack = Object.values(item).join(" ").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const needle = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return haystack.includes(needle);
}

export function uniqueBy(items, keyGetter) {
  const map = new Map();
  for (const item of items) {
    const key = keyGetter(item);
    if (!map.has(key)) map.set(key, item);
  }
  return [...map.values()];
}
