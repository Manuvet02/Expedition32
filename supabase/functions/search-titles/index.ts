const TMDB_TOKEN = Deno.env.get("TMDB_TOKEN");
const RAWG_KEY = Deno.env.get("RAWG_KEY");
const ANILIST_URL = "https://graphql.anilist.co";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, content-type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

const year = (date?: string | null) =>
  date ? Number.parseInt(date.slice(0, 4), 10) : null;

async function searchTmdb(query: string) {
  if (!TMDB_TOKEN) throw new Error("TMDB_TOKEN non configurato");

  const url =
    `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(query)}` +
    "&language=it-IT&include_adult=false";
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${TMDB_TOKEN}` },
  });
  if (!response.ok) throw new Error(`TMDB ha risposto ${response.status}`);

  const data = await response.json();
  return (data.results ?? [])
    .filter((item: any) => item.media_type === "movie" || item.media_type === "tv")
    .slice(0, 8)
    .map((item: any) => ({
      source: item.media_type === "movie" ? "tmdb_movie" : "tmdb_tv",
      external_id: String(item.id),
      name: item.title ?? item.name,
      year: year(item.release_date ?? item.first_air_date),
      poster_url: item.poster_path
        ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
        : null,
      rating: item.vote_average ?? null,
      rating_scale: 10,
      rating_count: item.vote_count ?? null,
    }));
}

async function searchRawg(query: string) {
  if (!RAWG_KEY) throw new Error("RAWG_KEY non configurato");

  const url =
    `https://api.rawg.io/api/games?key=${RAWG_KEY}` +
    `&search=${encodeURIComponent(query)}&page_size=8`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`RAWG ha risposto ${response.status}`);

  const data = await response.json();
  return (data.results ?? []).map((game: any) => ({
    source: "rawg_game",
    external_id: String(game.id),
    name: game.name,
    year: year(game.released),
    poster_url: game.background_image ?? null,
    rating: game.rating ?? null,
    rating_scale: 5,
    rating_count: game.ratings_count ?? null,
    metacritic: game.metacritic ?? null,
    platforms: (game.platforms ?? [])
      .map((entry: any) => entry.platform?.name)
      .filter(Boolean)
      .slice(0, 4),
  }));
}

async function searchAniList(query: string) {
  const graphql = `
    query ($search: String!) {
      anime: Page(page: 1, perPage: 8) {
        media(search: $search, type: ANIME, isAdult: false, sort: SEARCH_MATCH) {
          id
          type
          title { romaji english native }
          startDate { year }
          seasonYear
          coverImage { medium }
          averageScore
          popularity
        }
      }
      manga: Page(page: 1, perPage: 8) {
        media(search: $search, type: MANGA, isAdult: false, sort: SEARCH_MATCH) {
          id
          type
          title { romaji english native }
          startDate { year }
          seasonYear
          coverImage { medium }
          averageScore
          popularity
        }
      }
    }
  `;

  const response = await fetch(ANILIST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query: graphql, variables: { search: query } }),
  });
  if (!response.ok) throw new Error(`AniList ha risposto ${response.status}`);

  const payload = await response.json();
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error: any) => error.message).join("; "));
  }

  const mapMedia = (items: any[], type: "ANIME" | "MANGA") =>
    (items ?? []).map((media: any) => ({
      source: type === "ANIME" ? "anilist_anime" : "anilist_manga",
      external_id: String(media.id),
      name: media.title?.english ?? media.title?.romaji ?? media.title?.native ?? "Titolo sconosciuto",
      year: media.startDate?.year ?? media.seasonYear ?? null,
      poster_url: media.coverImage?.medium ?? null,
      rating: media.averageScore == null ? null : media.averageScore,
      rating_scale: 100,
      popularity: media.popularity ?? null,
    }));

  return [
    ...mapMedia(payload.data?.anime?.media, "ANIME"),
    ...mapMedia(payload.data?.manga?.media, "MANGA"),
  ];
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const { q } = await request.json();
    const query = typeof q === "string" ? q.trim() : "";
    if (query.length < 2) return json([]);

    const [media, games, animeAndManga] = await Promise.all([
      searchTmdb(query).catch((error) => {
        console.error("Errore ricerca TMDB", error);
        return [];
      }),
      searchRawg(query).catch((error) => {
        console.error("Errore ricerca RAWG", error);
        return [];
      }),
      searchAniList(query).catch((error) => {
        console.error("Errore ricerca AniList", error);
        return [];
      }),
    ]);

    return json([...media, ...games, ...animeAndManga]);
  } catch (error) {
    console.error("Errore nella funzione search-titles", error);
    return json({ error: "search_failed" }, 500);
  }
});
