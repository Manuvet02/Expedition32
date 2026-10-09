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

async function tmdbDetails(kind: "movie" | "tv", id: string) {
  if (!TMDB_TOKEN) throw new Error("TMDB_TOKEN non configurato");

  const url =
    `https://api.themoviedb.org/3/${kind}/${encodeURIComponent(id)}` +
    "?language=it-IT&append_to_response=credits,videos";
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${TMDB_TOKEN}` },
  });
  if (!response.ok) return null;

  const data = await response.json();
  const crew = data.credits?.crew ?? [];
  const cast = data.credits?.cast ?? [];
  const director = kind === "movie"
    ? crew.find((person: any) => person.job === "Director")?.name ?? null
    : null;
  const trailer = (data.videos?.results ?? []).find(
    (video: any) => video.site === "YouTube" && video.type === "Trailer" && video.official,
  );

  return {
    source: kind === "movie" ? "tmdb_movie" : "tmdb_tv",
    external_id: String(data.id),
    name: data.title ?? data.name,
    year: year(data.release_date ?? data.first_air_date),
    poster_url: data.poster_path
      ? `https://image.tmdb.org/t/p/w342${data.poster_path}`
      : null,
    backdrop_url: data.backdrop_path
      ? `https://image.tmdb.org/t/p/w780${data.backdrop_path}`
      : null,
    overview: data.overview || null,
    genres: (data.genres ?? []).map((genre: any) => genre.name),
    meta: kind === "movie"
      ? data.runtime ? `${data.runtime} min` : null
      : data.number_of_seasons ? `${data.number_of_seasons} stagioni` : null,
    rating: data.vote_average ?? null,
    rating_scale: 10,
    rating_count: data.vote_count ?? null,
    runtime_minutes: kind === "movie" ? data.runtime ?? null : null,
    season_count: kind === "tv" ? data.number_of_seasons ?? null : null,
    episode_count: kind === "tv" ? data.number_of_episodes ?? null : null,
    director,
    creators: (data.created_by ?? []).map((person: any) => person.name),
    cast: cast.slice(0, 8).map((person: any) => person.name),
    trailer_url: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
  };
}

async function rawgDetails(id: string) {
  if (!RAWG_KEY) throw new Error("RAWG_KEY non configurato");

  const response = await fetch(
    `https://api.rawg.io/api/games/${encodeURIComponent(id)}?key=${RAWG_KEY}`,
  );
  if (!response.ok) return null;
  const data = await response.json();

  return {
    source: "rawg_game",
    external_id: String(data.id),
    name: data.name,
    year: year(data.released),
    poster_url: data.background_image ?? null,
    backdrop_url: data.background_image_additional ?? data.background_image ?? null,
    overview: data.description_raw || null,
    genres: (data.genres ?? []).map((genre: any) => genre.name),
    meta: (data.platforms ?? [])
      .map((entry: any) => entry.platform?.name)
      .filter(Boolean)
      .join(", ") || null,
    rating: data.rating ?? null,
    rating_scale: 5,
    rating_count: data.ratings_count ?? null,
    metacritic: data.metacritic ?? null,
    platforms: (data.platforms ?? [])
      .map((entry: any) => entry.platform?.name)
      .filter(Boolean),
    developers: (data.developers ?? []).map((person: any) => person.name),
    publishers: (data.publishers ?? []).map((person: any) => person.name),
    esrb_rating: data.esrb_rating?.name ?? null,
    website: data.website || null,
  };
}

async function aniListDetails(type: "ANIME" | "MANGA", id: number) {
  const query = `
    query ($id: Int!, $type: MediaType!) {
      Media(id: $id, type: $type) {
        id
        type
        title { romaji english native }
        startDate { year }
        seasonYear
        coverImage { extraLarge large }
        bannerImage
        description(asHtml: false)
        genres
        averageScore
        popularity
        format
        status
        episodes
        duration
        chapters
        volumes
        siteUrl
        trailer { id site }
        studios(isMain: true) { nodes { name } }
      }
    }
  `;
  const response = await fetch(ANILIST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables: { id, type } }),
  });
  if (!response.ok) return null;

  const payload = await response.json();
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error: any) => error.message).join("; "));
  }
  const data = payload.data?.Media;
  if (!data) return null;

  const isAnime = type === "ANIME";
  const format = data.format?.replaceAll("_", " ") ?? null;
  const meta = isAnime
    ? [format, data.episodes ? `${data.episodes} episodi` : null, data.duration ? `${data.duration} min/ep` : null]
      .filter(Boolean).join(" · ") || null
    : [format, data.volumes ? `${data.volumes} volumi` : null, data.chapters ? `${data.chapters} capitoli` : null]
      .filter(Boolean).join(" · ") || null;
  const trailer = data.trailer?.site?.toLowerCase() === "youtube" && data.trailer.id
    ? `https://www.youtube.com/watch?v=${data.trailer.id}`
    : null;

  return {
    source: isAnime ? "anilist_anime" : "anilist_manga",
    external_id: String(data.id),
    name: data.title?.english ?? data.title?.romaji ?? data.title?.native ?? "Titolo sconosciuto",
    year: data.startDate?.year ?? data.seasonYear ?? null,
    poster_url: data.coverImage?.large ?? data.coverImage?.extraLarge ?? null,
    backdrop_url: data.bannerImage ?? null,
    overview: data.description || null,
    genres: data.genres ?? [],
    meta,
    rating: data.averageScore == null ? null : data.averageScore,
    rating_scale: 100,
    popularity: data.popularity ?? null,
    format,
    status: data.status?.replaceAll("_", " ") ?? null,
    episode_count: isAnime ? data.episodes ?? null : null,
    chapter_count: !isAnime ? data.chapters ?? null : null,
    volume_count: !isAnime ? data.volumes ?? null : null,
    studios: (data.studios?.nodes ?? []).map((studio: any) => studio.name),
    trailer_url: trailer,
    external_url: data.siteUrl ?? null,
  };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const { source, id } = await request.json();
    const externalId = String(id ?? "");
    if (!/^\d+$/.test(externalId)) return json({ error: "invalid_id" }, 400);

    let result = null;
    if (source === "tmdb_movie") result = await tmdbDetails("movie", externalId);
    else if (source === "tmdb_tv") result = await tmdbDetails("tv", externalId);
    else if (source === "rawg_game") result = await rawgDetails(externalId);
    else if (source === "anilist_anime") result = await aniListDetails("ANIME", Number(externalId));
    else if (source === "anilist_manga") result = await aniListDetails("MANGA", Number(externalId));
    else return json({ error: "invalid_source" }, 400);

    if (!result) return json({ error: "not_found" }, 404);
    return json(result);
  } catch (error) {
    console.error("Errore nella funzione title-details", error);
    return json({ error: "details_failed" }, 500);
  }
});
