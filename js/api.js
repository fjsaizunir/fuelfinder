export const API_BASE = "https://energia.serviciosmin.gob.es/ServiciosRestCarburantes/PreciosCarburantes";

export function buildUrl(endpoint) {
  return `${API_BASE}/${endpoint}`;
}

export async function getJson(endpoint) {
  const url = buildUrl(endpoint);
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Accept": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`La API ha devuelto el estado ${response.status}`);
  }

  return await response.json();
}

export const endpoints = {
  comunidades: () => "Listados/ComunidadesAutonomas/",
  provincias: () => "Listados/Provincias/",
  productos: () => "Listados/ProductosPetroliferos/",
  municipiosPorProvincia: (idProvincia) => `Listados/MunicipiosPorProvincia/${idProvincia}`,
  estacionesPorCCAA: (idCCAA) => `EstacionesTerrestres/FiltroCCAA/${idCCAA}`,
  estacionesPorCCAAProducto: (idCCAA, idProducto) => `EstacionesTerrestres/FiltroCCAAProducto/${idCCAA}/${idProducto}`,
  postesProvinciaProducto: (idProvincia, idProducto) => `PostesMaritimos/FiltroProvinciaProducto/${idProvincia}/${idProducto}`,
  historicoProvinciaProducto: (fecha, idProvincia, idProducto) => `EstacionesTerrestresHist/FiltroProvinciaProducto/${fecha}/${idProvincia}/${idProducto}`,
  historicoMunicipioProducto: (fecha, idMunicipio, idProducto) => `EstacionesTerrestresHist/FiltroMunicipioProducto/${fecha}/${idMunicipio}/${idProducto}`
};
