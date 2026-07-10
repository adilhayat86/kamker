-- Schema required by @opennextjs/cloudflare's D1 tag cache implementation.
-- See node_modules/@opennextjs/cloudflare/dist/api/overrides/tag-cache/d1-next-tag-cache.js
create table if not exists revalidations (
  tag text not null,
  revalidatedAt integer not null,
  stale integer,
  expire integer
);

create index if not exists revalidations_tag_idx on revalidations (tag);
