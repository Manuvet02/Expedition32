-- Normalize existing provider labels, then allow anime and manga from AniList.
alter table public.titles
  drop constraint if exists titles_source_check;

update public.titles
set source = case lower(source)
  when 'tmdb_movie' then 'tmdb_movie'
  when 'tmdb_tv' then 'tmdb_tv'
  when 'rawg_game' then 'rawg_game'
  when 'rawg' then 'rawg_game'
  when 'anilist_anime' then 'anilist_anime'
  when 'anilist_manga' then 'anilist_manga'
  else source
end;

alter table public.titles
  add constraint titles_source_check
  check (source = any (array[
    'tmdb_movie'::text,
    'tmdb_tv'::text,
    'rawg_game'::text,
    'anilist_anime'::text,
    'anilist_manga'::text
  ]));
