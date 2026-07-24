import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const INDEX_PATH = path.resolve(process.cwd(), "index.html");
const SEARCH_ENDPOINT = "https://places.googleapis.com/v1/places:searchText";
const SEARCH_QUERY =
  "Clínica LaCari Odontologia, Avenida Pires do Rio 3369, Jardim Norma, São Paulo, SP";

function normalize(value = "") {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function selectLacari(places) {
  return places.find((place) => {
    const name = normalize(place.displayName?.text);
    const address = normalize(place.formattedAddress);

    return (
      name.includes("lacari") &&
      address.includes("pires do rio") &&
      address.includes("3369")
    );
  });
}

async function fetchPlaces() {
  const fixturePath = process.env.GOOGLE_PLACES_FIXTURE;
  if (fixturePath) {
    return JSON.parse(await readFile(path.resolve(fixturePath), "utf8"));
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Defina o segredo GOOGLE_MAPS_API_KEY antes de executar a atualização."
    );
  }

  const response = await fetch(SEARCH_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount"
    },
    body: JSON.stringify({
      textQuery: SEARCH_QUERY,
      languageCode: "pt-BR",
      regionCode: "BR",
      pageSize: 5
    })
  });

  const payload = await response.json();
  if (!response.ok) {
    const detail = payload.error?.message || `HTTP ${response.status}`;
    throw new Error(`A consulta ao Google Places falhou: ${detail}`);
  }

  return payload;
}

function replaceExactlyOnce(source, pattern, replacement, label) {
  const matches = source.match(pattern);
  if (!matches || matches.length !== 1) {
    throw new Error(
      `Não foi possível atualizar "${label}": esperado 1 trecho, encontrado ${matches?.length || 0}.`
    );
  }

  return source.replace(pattern, replacement);
}

function updateIndex(source, rating, reviewCount) {
  const ratingPtBr = rating.toFixed(1).replace(".", ",");
  let updated = source;

  updated = replaceExactlyOnce(
    updated,
    /aria-label="Clínica LaCari: nota [\d,.]+ em \d+ avaliações no Google"/g,
    `aria-label="Clínica LaCari: nota ${ratingPtBr} em ${reviewCount} avaliações no Google"`,
    "descrição acessível da avaliação"
  );
  updated = replaceExactlyOnce(
    updated,
    /<strong data-google-rating>[\d,.]+ no Google<\/strong>/g,
    `<strong data-google-rating>${ratingPtBr} no Google</strong>`,
    "nota no topo"
  );
  updated = replaceExactlyOnce(
    updated,
    /<span data-google-review-count>\d+ avaliações<\/span>/g,
    `<span data-google-review-count>${reviewCount} avaliações</span>`,
    "quantidade no topo"
  );
  updated = replaceExactlyOnce(
    updated,
    /<strong data-google-rating>[\d,.]+ de avaliação no Google<\/strong>/g,
    `<strong data-google-rating>${ratingPtBr} de avaliação no Google</strong>`,
    "nota na seção de avaliações"
  );
  updated = replaceExactlyOnce(
    updated,
    /<small data-google-review-count>\d+ avaliações públicas<\/small>/g,
    `<small data-google-review-count>${reviewCount} avaliações públicas</small>`,
    "quantidade na seção de avaliações"
  );

  return updated;
}

const payload = await fetchPlaces();
const place = selectLacari(payload.places || []);

if (!place) {
  throw new Error(
    "A Clínica LaCari não foi identificada com segurança na resposta do Google Places."
  );
}

const rating = Number(place.rating);
const reviewCount = Number(place.userRatingCount);

if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
  throw new Error(`Nota inválida recebida do Google Places: ${place.rating}`);
}
if (!Number.isInteger(reviewCount) || reviewCount < 1) {
  throw new Error(
    `Quantidade de avaliações inválida recebida do Google Places: ${place.userRatingCount}`
  );
}

const currentIndex = await readFile(INDEX_PATH, "utf8");
const updatedIndex = updateIndex(currentIndex, rating, reviewCount);

console.log(
  `Perfil confirmado: ${place.displayName.text} — ${rating.toFixed(1)} (${reviewCount} avaliações).`
);

if (updatedIndex === currentIndex) {
  console.log("O site já está atualizado; nenhum arquivo foi alterado.");
} else {
  await writeFile(INDEX_PATH, updatedIndex, "utf8");
  console.log("index.html atualizado com os dados mais recentes.");
}
