# Pokedex

A technical assessment for a potential internship position.

A browsable Pokedex for the first 1010 Pokemon, built with Next.js and TypeScript against the [PokéAPI](https://pokeapi.co). Search and sort the index on the home page, click any Pokemon for a detail page with its artwork, physical stats, types, weaknesses, and base stats.

## Stack

- **Next.js 16** (App Router) with React 19
- **TypeScript**
- **Tailwind CSS 4** for utility styling, plus hand-written CSS in `app/globals.css` for the card and detail layouts
- **pnpm** for package management
- **PokéAPI** as the sole data source — no database, no API keys, no `.env` needed

## Getting started

The Next.js app lives in the `pokedex/` subdirectory, not the repo root.

```bash
cd pokedex
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

| Script | What it does |
| --- | --- |
| `pnpm dev` | Development server |
| `pnpm build` | Production build |
| `pnpm start` | Serve a production build (run `build` first) |
| `pnpm lint` | ESLint |

## How it works

The home page is a server component that fetches the 1010-entry index and hands it to `PokemonClient`, which owns search (debounced, matches name, `25`, or `025`), sort, and "Load More" pagination. Card details are fetched lazily as cards become visible, deduped by a ref and cancelled via `AbortController` when the filter changes.

Detail pages fetch the Pokemon and its species in parallel, then resolve weaknesses from the types. `toPokemon` in `lib/pokeapi.ts` is the only place raw DTOs become the domain model — unit conversion, English-language picking, and flavor-text cleanup all live there.

All requests go through one `fetchJson` wrapper using `next: { revalidate: false }`. Pokemon data is immutable, so each resource is fetched once and cached indefinitely.

## Layout

```
pokedex/
├── app/
│   ├── page.tsx              # Home — server-fetches the index, renders PokemonClient
│   ├── globals.css           # Tailwind entry + hand-written card/detail CSS
│   └── pokemon/[id]/         # Detail page, plus loading / error / not-found
├── components/
│   └── pokemon-client.tsx    # Search, sort, pagination, lazy detail fetching
├── lib/
│   ├── pokeapi.ts            # Fetchers + DTO → domain mapping
│   └── weakness.ts           # Weakness resolution from type damage relations
├── hooks/
└── types/
```

## Known limitations

- **Weaknesses are a union, not a multiplier calculation.** `getWeaknesses` collects `double_damage_from` across a Pokemon's types, so dual types are wrong where the second type resists or nullifies the first's weakness — a Ground/Flying Pokemon shows as weak to Ground despite being immune.
- **Type filtering is not wired up.** `PokemonClient` holds `typeFilter` state and the filtering logic works, but nothing renders a control to set it. The home page still pays to build the type index on cold load and never uses it.
- **No tests.** The time went into the data layer and the UI.
