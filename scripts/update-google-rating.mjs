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
        "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.googleMapsUri,places.reviews"
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

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeGoogleUrl(value, fallback) {
  try {
    const url = new URL(value);
    const allowedHost =
      url.hostname === "google.com" ||
      url.hostname.endsWith(".google.com") ||
      url.hostname === "googleusercontent.com" ||
      url.hostname.endsWith(".googleusercontent.com");
    if (url.protocol === "https:" && allowedHost) {
      return url.href;
    }
  } catch {
    // Mantém o link geral do perfil quando a URL individual não está disponível.
  }
  return fallback;
}

function authorInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function renderReviews(reviews, placeUrl) {
  const publicReviews = reviews
    .filter((review) => review.text?.text?.trim())
    .slice(0, 3);

  if (!publicReviews.length) {
    return null;
  }

  const cards = publicReviews.map((review) => {
    const author = review.authorAttribution?.displayName?.trim() || "Paciente";
    const authorUrl = safeGoogleUrl(review.authorAttribution?.uri, placeUrl);
    const reviewUrl = safeGoogleUrl(review.googleMapsUri, placeUrl);
    const photoUrl = safeGoogleUrl(review.authorAttribution?.photoUri, "");
    const relativeTime =
      review.relativePublishTimeDescription?.trim() || "Avaliação no Google";
    const stars = Math.max(1, Math.min(5, Math.round(Number(review.rating) || 5)));
    const avatar = photoUrl
      ? `<a class="review-author-avatar" href="${escapeHtml(authorUrl)}" target="_blank" rel="noopener" aria-label="Perfil de ${escapeHtml(author)} no Google"><img src="${escapeHtml(photoUrl)}" alt="" width="36" height="36" loading="lazy"></a>`
      : `<span class="review-author-avatar" aria-hidden="true">${escapeHtml(authorInitials(author))}</span>`;

    return `                    <blockquote>
                        <span class="review-stars" aria-label="${stars} de 5 estrelas">${"★".repeat(stars)}${"☆".repeat(5 - stars)}</span>
                        <p>“${escapeHtml(review.text.text.trim())}”</p>
                        <footer class="review-author">
                            ${avatar}
                            <cite>
                                <a href="${escapeHtml(authorUrl)}" target="_blank" rel="noopener"><strong>${escapeHtml(author)}</strong></a>
                                <a href="${escapeHtml(reviewUrl)}" target="_blank" rel="noopener">${escapeHtml(relativeTime)} · Google</a>
                            </cite>
                        </footer>
                    </blockquote>`;
  });

  return `<!-- google-reviews:start -->
                <div class="review-preview-grid">
${cards.join("\n")}
                </div>
                <!-- google-reviews:end -->`;
}

function updateIndex(source, rating, reviewCount, reviews = [], googleMapsUri = "") {
  const ratingPtBr = rating.toFixed(1).replace(".", ",");
  let updated = source;
  const fallbackMapsUrl =
    "https://www.google.com/maps/search/?api=1&query=Cl%C3%ADnica%20LaCari%20Odontologia%20Avenida%20Pires%20do%20Rio%203369%20Jardim%20Norma%20S%C3%A3o%20Paulo%20SP";
  const placeUrl = safeGoogleUrl(googleMapsUri, fallbackMapsUrl);

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
    /<span class="google-rating-score" data-google-rating>[\d,.]+<\/span>/g,
    `<span class="google-rating-score" data-google-rating>${ratingPtBr}</span>`,
    "nota na seção de avaliações"
  );
  updated = replaceExactlyOnce(
    updated,
    /<small data-google-review-count>\d+ avaliações públicas<\/small>/g,
    `<small data-google-review-count>${reviewCount} avaliações públicas</small>`,
    "quantidade na seção de avaliações"
  );

  const reviewMarkup = renderReviews(reviews, placeUrl);
  if (reviewMarkup) {
    updated = replaceExactlyOnce(
      updated,
      /<!-- google-reviews:start -->[\s\S]*?<!-- google-reviews:end -->/g,
      reviewMarkup,
      "depoimentos na seção de avaliações"
    );
  }

  updated = replaceExactlyOnce(
    updated,
    /(<a class="btn btn-light reviews-cta" data-google-reviews-url href=")[^"]+(")/g,
    `$1${escapeHtml(placeUrl)}$2`,
    "link para todas as avaliações"
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
const updatedIndex = updateIndex(
  currentIndex,
  rating,
  reviewCount,
  place.reviews || [],
  place.googleMapsUri
);

console.log(
  `Perfil confirmado: ${place.displayName.text} — ${rating.toFixed(1)} (${reviewCount} avaliações).`
);

if (updatedIndex === currentIndex) {
  console.log("O site já está atualizado; nenhum arquivo foi alterado.");
} else {
  await writeFile(INDEX_PATH, updatedIndex, "utf8");
  console.log("index.html atualizado com os dados mais recentes.");
}
