# Pokédex — Development Cycle

**Target:** Old.St Labs Technical Assessment (Internship Program)
**Stack:** Next.js (App Router) + TypeScript, scaffolded via `pnpm create next-app`
**Budget:** 3 days

---

## How to read this document

Every step follows the same shape:

- **Do** — the concrete action.
- **Why** — the reasoning. If you can't restate this in your own words, don't do the step yet.
- **Done when** — the observable condition that lets you move on.

Do not skip ahead. The ordering is not arbitrary; each phase produces the input the next phase consumes. Jumping to UI before the data layer exists is the single most common way this project dies on Day 3.

---

## Phase 0 — Reconnaissance (2–3 hours, Day 1 morning)

**You are not allowed to write application code in this phase.** You are learning the shape of the data. Every architectural decision downstream is a consequence of what you find here.

### Step 0.0 — Tooling: what `curl` and `jq` actually are

If you ran the commands below and got `jq: command not found`, that's expected — read this first.

**`curl`** is a command-line HTTP client. `curl "https://..."` makes a GET request and dumps the raw response body to your terminal. It ships with macOS, Linux, and Windows 10+. The `-s` flag means *silent* — it suppresses the download progress bar, which otherwise clutters the output.

**`jq`** is a separate program that formats and queries JSON. It is **not** part of `curl` and is not installed by default anywhere. The `|` (pipe) between them means "take `curl`'s output and feed it into `jq` as input."

So `curl -s "https://..." | jq '.count'` reads as: *fetch this URL quietly, then pull the `count` field out of the JSON.*

Without `jq`, `curl` still works — you just get a single unreadable wall of minified JSON. That's why the commands below use it.

**Install `jq`:**

```bash
# macOS
brew install jq

# Windows (PowerShell, using winget)
winget install jqlang.jq

# Windows (Chocolatey)
choco install jq

# Ubuntu / WSL / Debian
sudo apt install jq
```

Restart your terminal afterward, then verify with `jq --version`.

**If you'd rather not install anything,** you have three fallbacks. Any of them are fine — the point of this phase is *understanding the data*, not the tool you use to look at it:

1. **Just paste the URL into your browser.** Chrome and Firefox both pretty-print and collapse JSON natively. This is honestly the fastest option for exploration, and you can expand and collapse nested objects by clicking.

2. **Use Node, which you already have** (you installed it for Next.js):
   ```bash
   node -e "fetch('https://pokeapi.co/api/v2/pokemon/1').then(r=>r.json()).then(d=>console.log(Object.keys(d)))"
   ```
   Swap `Object.keys(d)` for `d.count`, `d.damage_relations`, or whatever you're inspecting.

3. **Pipe through Python**, if it's on your machine:
   ```bash
   curl -sL "https://pokeapi.co/api/v2/pokemon/1/" | python -m json.tool
   ```
   This pretty-prints but can't query — you'll scroll a lot.

**A note on Windows shells.** These commands are written for **bash**. If you run them in PowerShell you will hit two separate problems:

1. **Quoting.** PowerShell does not strip single quotes the way bash does, so `jq 'keys'` passes the literal characters `'keys'` to `jq`, which fails with `syntax error, unexpected INVALID_CHARACTER`. Use double quotes instead: `jq "keys"`, `jq ".count"`, `jq ".damage_relations"`.
2. **The `curl` alias.** In Windows PowerShell 5.1, `curl` is an alias for `Invoke-WebRequest`, which is a different program and rejects `-s` and `-L` outright. In PowerShell 7+ the alias was removed and `curl` resolves to the real `curl.exe`, so the flags work fine. If `-sL` errors, you're on 5.1.

**The clean fix is to use Git Bash or WSL for this phase**, where every command in this document works verbatim. That's a five-minute setup that saves you from debugging your shell instead of the API. But if you'd rather stay in PowerShell 7, just swap the single quotes for double quotes and everything else holds.

**Done when:** `jq --version` prints a version number, or you've picked one of the fallbacks and can read a formatted PokeAPI response.

---

### Step 0.1 — Map the API surface with curl, not with code

**Do:**

```bash
# How many Pokémon actually exist?
curl -sL "https://pokeapi.co/api/v2/pokemon?limit=1" | jq '.count'

# What does one page of the list look like?
curl -sL "https://pokeapi.co/api/v2/pokemon?limit=3&offset=0" | jq

# What does one Pokémon look like?
curl -sL "https://pokeapi.co/api/v2/pokemon/1/" | jq 'keys'

# What does the species endpoint add?
curl -sL "https://pokeapi.co/api/v2/pokemon-species/1/" | jq 'keys'

# What does a type tell us?
curl -sL "https://pokeapi.co/api/v2/type/grass/" | jq '.damage_relations'
```

**Note the trailing slashes and the `-L` flag.** PokeAPI serves its resource URLs canonically *with* a trailing slash and issues a `301` redirect for the ones without. `curl` does **not** follow redirects unless you tell it to, so `curl -s ".../pokemon/1"` returns an empty body, and `jq` then errors on empty input. The query-string URLs (`?limit=...`) aren't redirected, which is why they work either way — a confusing inconsistency if you don't know the cause.

`-L` means *follow redirects*. `-sL` combines it with `-s` (silent). Adding the trailing slash makes the redirect unnecessary in the first place, so do both: it's one fewer round-trip.

**When a `curl` command returns nothing, diagnose it instead of guessing.** Drop `-s`, add `-i` to see the response headers:

```bash
curl -i "https://pokeapi.co/api/v2/pokemon/1"
# HTTP/2 301
# location: /api/v2/pokemon/1/     ← there's your answer
```

This habit — read the status code before theorizing — is worth internalizing well beyond this project.

**Why:** You are about to discover three facts that determine the entire architecture. If you learn them by trial and error inside React components, you will refactor twice and lose a day. Learning them from `curl` costs twenty minutes.

**The three facts:**

1. **The list endpoint is nearly useless on its own.** `/pokemon?limit=10` returns only `{ name, url }` per entry. No ID. No type. No image. The spec requires every card to show ID, name, photo, *and* type. So the list endpoint alone cannot render a single card — you must fetch each Pokémon's detail separately.

2. **The ID is hidden in the URL.** `https://pokeapi.co/api/v2/pokemon/25/` — you parse the ID out of the trailing path segment. This is ugly but it means you can build a complete ID↔name mapping from the index alone, with no extra requests.

3. **`count` will not equal 1010.** The API currently reports well over 1300 entries, because it includes alternate forms (`deoxys-attack`, `charizard-mega-x`). The spec explicitly says `002-1010`. Those extra forms also have no artwork at the `assets.pokemon.com` URL the spec mandates.

**Done when:** You have written the three facts above into a scratch file in your own words, and you can state what `damage_relations.double_damage_from` contains.

---

### Step 0.2 — Decide the ID ceiling, and write down why

**Do:** Cap the application at IDs 1–1010. Hardcode it as a named constant, not a magic number.

**Why:** Three reasons, and you should be able to give all three if asked in the interview:

1. The spec says so (`002-1010`).
2. IDs above 1010 in PokeAPI are alternate forms starting at 10001, not a contiguous range — so "next/previous by ID" would break immediately past the boundary.
3. The mandated artwork URL only reliably resolves for the base National Dex range.

**Why this matters more than it looks:** The grader is checking whether you read the spec or pattern-matched a tutorial. A submission that silently loads 1302 Pokémon with broken images on half of them says "I copied someone's blog post." A submission with `export const MAX_POKEMON_ID = 1010;` and a one-line comment says "I read the requirements and made a call."

**Done when:** `src/lib/constants.ts` exists with the constant and a comment explaining the boundary.

---

### Step 0.3 — Resolve the weakness-chart contradiction *now*

**Do:** Compare two sources for Grass-type weaknesses.

- The spec's example: *"Type is Grass then the Weaknesses will be Flying, Poison, Bug, Steel, Fire, Grass, Dragon."*
- PokeAPI: `curl -s "https://pokeapi.co/api/v2/type/grass" | jq '.damage_relations.double_damage_from[].name'` → Flying, Poison, Bug, Fire, Ice.

They disagree. The spec links a **Pokémon GO** type chart, which uses different mechanics from the mainline games PokeAPI models. The spec's list appears to be conflating "takes double damage from" with "is not very effective against."

**Decide:** Derive weaknesses from PokeAPI's `damage_relations.double_damage_from`, unioned across the Pokémon's types.

**Why:** Deriving from the API is defensible, data-driven, and handles dual-types correctly with zero hardcoding. Hardcoding a chart transcribed from a web page is 18×18 entries of opportunity for typos, and it isn't *more* correct — it's just differently correct. Either answer can be justified; the unjustified answer is the one where you didn't notice the conflict.

**Why this is the single highest-leverage thing in the whole project:** You are being graded by an engineer. Engineers do not reward people who follow ambiguous specs blindly. They reward people who *notice* ambiguity, make a call, and document it. This one paragraph in your README will do more for you than any feature.

**Done when:** You have a two-sentence note ready for the README stating the discrepancy and your choice.

---

### Step 0.4 — Nail down the "search across all Pokémon" problem

**Do:** Reason through this before touching code.

The spec requires: initial load of **10** Pokémon, "Load More" below, and search/filter/sort by ID or name.

Naive approach — paginate the API (`offset=0,10,20…`) and search whatever's currently loaded. **This is broken.** Search "Pikachu" (ID 25) on the first page and you get nothing, because Pikachu hasn't been fetched yet. Sort by name descending, and you sort ten items instead of a thousand. Roughly 80% of submissions ship this bug.

Correct approach — **fetch the full index once, paginate on the client.**

```
On app load:  GET /pokemon?limit=1010  →  1010 × { name, url }  →  derive { id, name }
              This is ~60–70 KB. One request. Cached forever (the data never changes).

Master list (1010 items)
      ↓  filter by search query (name substring OR id match)
      ↓  filter by selected type
      ↓  sort (id asc/desc, name asc/desc)
      ↓  slice(0, visibleCount)          ← "Load More" just does visibleCount += 10
      ↓  fetch full details for the visible slice (Promise.all, cached)
      ↓  render cards
```

**Why:** Search, sort, and filter are *set operations over the complete dataset*. Pagination is a *presentation concern*. Conflating them is the design error. Once separated, "Load More" collapses into `setVisibleCount(v => v + 10)` — one line — and search works correctly across all 1010 by construction.

**Why the 60 KB is fine:** It's a single cached request. Fetching 1010 *detail* objects would be unacceptable (that's ~1010 requests and several MB); fetching 1010 *name+url* pairs is one request and less than a single photo on the page.

**The one gap:** type filtering needs types, and the index has no types. Solve it by fetching the 18 type endpoints once (`/type/{name}` returns every Pokémon of that type) and building a `Map<typeName, Set<id>>`. That's 18 cached requests at startup, and now type-filtering is a set lookup on the master list — no detail fetch required.

**Done when:** You can draw the pipeline above from memory on paper.

---

### Step 0.5 — Initialize the repo properly

**Do:**

```bash
git init                       # if create-next-app didn't
git add -A
git commit -m "chore: scaffold Next.js app"
```

Then commit at the end of **every step below**. Conventional prefixes: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `style:`.

**Why:** Your git history is a graded artifact whether or not anyone says so. A history of 20 scoped commits with clear messages is evidence of an engineer who works incrementally. A single commit titled `final` at 3 a.m. on the deadline is evidence of someone who cannot decompose a problem. It costs you nothing to do this correctly and it is genuinely one of the cheapest signals available.

**Done when:** `git log --oneline` shows your scaffold commit.

---

## Phase 1 — The data layer (Day 1 afternoon)

**Rule for this entire phase: no JSX.** You are building the foundation. If you find yourself opening a `.tsx` component file, you have skipped ahead.

### Step 1.1 — Type only what you consume

**Do:** Create `src/types/pokemon.ts`. Model the *subset* of the API response your app actually reads.

**Why:** PokeAPI's `/pokemon/{id}` response is enormous — game indices, move lists, every past-generation form. Typing all of it is a day of work with zero payoff. Typing none of it (`any`) is a visible code smell that a reviewer will spot in ten seconds. Typing exactly what you consume is the professional middle path, and it *documents your data requirements* — someone reading `types/pokemon.ts` learns what the app needs without reading a single component.

**A note on `any`:** Every `any` in your submission is a small confession that you didn't understand the data. Zero of them. If you're stuck, `unknown` plus a narrowing check is the honest escape hatch.

**Done when:** Types compile and cover: index entry, detail (id, name, height, weight, types, stats, sprites), species (genus/category, flavor text), and type damage relations.

---

### Step 1.2 — Build `src/lib/pokeapi.ts` — one module, all network access

**Do:** Export exactly these functions, and nothing else:

| Function | Returns | Notes |
|---|---|---|
| `getPokemonIndex()` | `{ id, name }[]` (1010 items) | Parses the ID from the URL. Called once. |
| `getPokemon(id)` | detail object | |
| `getPokemonSpecies(id)` | species object | Provides "Category" (genus). |
| `getType(name)` | type object | `damage_relations` lives here. |
| `getTypeIndex()` | `Map<string, Set<number>>` | The 18 type→IDs map from Step 0.4. |

**Why one module:** This is the **single most important structural rule in the project.** Every network call lives behind this file. Components never call `fetch`. Hooks never call `fetch`. Only `lib/pokeapi.ts` calls `fetch`.

The payoff is concrete, not academic:
- **One place to change** if the base URL, caching strategy, or error handling changes.
- **One place to read** to understand every external dependency the app has.
- **Testable in isolation** without rendering anything.
- **A grader can audit your whole data layer in one file.** Make that file good and you've made a strong impression before they open a component.

If a reviewer opens `PokemonCard.tsx` and finds a raw `fetch()` inside it, the abstraction is a lie and they will stop trusting the rest of the code.

**Do also:** Let Next.js's built-in `fetch` cache do the caching. PokeAPI data is immutable — Bulbasaur's height will not change. You do not need to write a cache layer, a `Map`, or `sessionStorage`. Adding one is duplicated infrastructure the framework already gives you.

```ts
const res = await fetch(url, { next: { revalidate: false } }); // cache indefinitely
if (!res.ok) throw new Error(`PokeAPI ${res.status} for ${url}`);
```

**Build your URLs with the trailing slash** (`/api/v2/pokemon/${id}/`), for the reason you found in Step 0.1. `fetch` follows redirects automatically, so omitting it won't *break* anything — it just costs you an extra round-trip on every single request. On a page loading ten Pokémon, that's ten wasted requests. Free performance for one character.

**Why throw instead of returning `null`:** Returning `null` on failure pushes an error check into every single call site, and you will forget one. Throwing lets Next.js's `error.tsx` boundary catch it and render a real error state — which is one of the six things graders explicitly look for.

**Done when:** A temporary `console.log` in a Server Component prints Pikachu's stats. Then delete the log and commit.

---

### Step 1.3 — `src/lib/weakness.ts` — derive, don't hardcode

**Do:**

```ts
export async function getWeaknesses(typeNames: string[]): Promise<string[]> {
  const types = await Promise.all(typeNames.map(getType));
  const weaknesses = new Set<string>();
  for (const t of types) {
    for (const rel of t.damage_relations.double_damage_from) {
      weaknesses.add(rel.name);
    }
  }
  return [...weaknesses];
}
```

**Why `Set`:** Dual-types produce duplicates. Charizard is Fire/Flying — both are weak to Rock, so a naive array yields `["rock", ..., "rock"]`. `Set` dedupes for free and communicates *intent*: "this is a collection of distinct weaknesses." That's a small thing, and small things are what "intern-level" is measured by.

**Why `Promise.all` and not a `for...await` loop:** Two types means two independent requests. Awaiting them in sequence doubles the latency for no reason. This is the single most common performance mistake in junior code, and reviewers look for it specifically.

**Optional refinement, if time allows:** True dual-type effectiveness multiplies — Flying resists Grass while Fire is weak to it, so some naive "weaknesses" cancel out. Handling `half_damage_from` and `no_damage_from` to compute a proper multiplier is a genuinely nice touch. **Do not attempt it on Day 1.** Note it in the README's "with more time" section and move on. Shipping beats gold-plating.

**Done when:** `getWeaknesses(['fire', 'flying'])` returns a deduped list, verified in a Server Component.

---

### Step 1.4 — Configure the image host before you touch `next/image`

**Do:** In `next.config.ts`:

```ts
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'assets.pokemon.com' },
    { protocol: 'https', hostname: 'raw.githubusercontent.com' }, // sprite fallback
  ],
},
```

And in `src/lib/utils.ts`:

```ts
export const padId = (id: number) => String(id).padStart(3, '0');
export const artworkUrl = (id: number) =>
  `https://assets.pokemon.com/assets/cms2/img/pokedex/full/${padId(id)}.png`;
```

**Why now, not later:** `next/image` refuses to load any remote host that isn't allowlisted, and it fails with a runtime error, not a warning. If you discover this at 11 p.m. on Day 3, you will panic and swap to a plain `<img>`, silently giving up Next's image optimization — a feature you chose the framework for. Five minutes now.

**Why `padStart`:** The spec is explicit — ID 1 must be `001`. This is a two-line utility and it is *also* a trap: a submission that requests `.../full/1.png` gets a 404, ships broken images, and demonstrates that the author skimmed the requirements. Read carefully, implement exactly.

**Done when:** `artworkUrl(1)` produces the `001.png` URL and it loads in a browser tab.

---

## Phase 2 — The detail page (Day 1 evening → Day 2 morning)

**Build this before the home page.** Counterintuitive, but correct.

**Why detail first:**

1. **It's a pure Server Component** — `async` function, `await` your lib calls, render. No client state, no hooks, no `useEffect`. It is the easiest page in a Next.js App Router app, and building it first lets you validate the entire data layer against real rendering with minimal moving parts.
2. **It exercises every API endpoint** — pokemon, species, and type. If the data layer is wrong, you find out here, cheaply, instead of debugging it inside a client component tangled up with search state.
3. **It's a complete, demonstrable feature by end of Day 1.** If Day 3 goes badly, you still have something real. Building the home page first would leave you at Day 3 with a half-finished detail page and no fallback.

### Step 2.1 — `src/app/pokemon/[id]/page.tsx`

**Do:** An `async` Server Component. Validate the param, fetch in parallel, render.

```tsx
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1 || id > MAX_POKEMON_ID) notFound();

  const [pokemon, species] = await Promise.all([
    getPokemon(id),
    getPokemonSpecies(id),
  ]);
  const weaknesses = await getWeaknesses(pokemon.types.map(t => t.type.name));
  // ...
}
```

**Why validate the param:** `/pokemon/banana` and `/pokemon/99999` are URLs a grader *will* type. Unvalidated, they produce a raw crash or an empty page. Validated, they hit `not-found.tsx` and render a clean 404. Handling hostile input is a large part of what separates "it works on my machine" from "it works."

**Why `Promise.all` for pokemon + species:** Independent requests. Sequential awaits are wasted latency. (Weaknesses must come *after*, because it depends on `pokemon.types` — that's a genuine dependency, not laziness.)

**Why `params` is a Promise:** In recent Next.js App Router versions, `params` is async. If you `await` it, you're on the current API. If your scaffold is older, adjust — but check, don't guess.

**Done when:** `/pokemon/25` renders Pikachu's ID, name, photo, height, weight, category, types, stats, and weaknesses. `/pokemon/banana` shows a 404.

---

### Step 2.2 — Next / Previous as `<Link>`, not state

**Do:**

```tsx
<Link href={`/pokemon/${id - 1}`} aria-disabled={id <= 1}>Previous</Link>
<Link href={`/pokemon/${id + 1}`} aria-disabled={id >= MAX_POKEMON_ID}>Next</Link>
```

Render them as disabled spans at the boundaries rather than links to `/pokemon/0`.

**Why `<Link>` and not `useState` + refetch:** The Pokémon being viewed *is* the URL. That's what the URL is for. Modeling it as component state instead would mean: you can't share a link to Charizard, the back button breaks, and you've hand-rolled a data-fetching lifecycle that the router already handles. Next also prefetches linked routes on hover, so navigation feels instant for free.

This is the clearest example in the project of "let the framework do its job." Reaching for `useState` here is the reflex of someone who learned React before they learned the web. Reaching for `<Link>` shows you understand that URLs are state.

**Why clamp at the boundaries:** `/pokemon/0` and `/pokemon/1011` don't exist. Letting users navigate into a 404 through your own UI is a bug you shipped deliberately.

**Done when:** You can walk 1 → 2 → 3 → back → back, and the buttons are correctly dead at 1 and 1010.

---

### Step 2.3 — `loading.tsx` and `error.tsx`

**Do:** Create both in `src/app/pokemon/[id]/`. `loading.tsx` = a skeleton matching the detail layout. `error.tsx` = `'use client'`, shows a message and a retry button wired to the `reset` prop.

**Why:** In the App Router these are *file-convention* features. Naming a file `loading.tsx` gets you an automatic Suspense boundary — you write zero state management. Two of the six things graders check, obtained for the price of creating two files.

**Why a skeleton and not a spinner:** A skeleton preserves layout, so the page doesn't jump when data arrives. It's a five-minute change that makes the app feel considered rather than assembled.

**Done when:** Throttle your network to Slow 3G in DevTools and watch the skeleton render. Then temporarily break the API URL and watch `error.tsx` catch it. Fix the URL. Commit.

---

## Phase 3 — The home page (Day 2)

### Step 3.1 — Server shell, client island

**Do:**

```tsx
// src/app/page.tsx — Server Component
export default async function Home() {
  const [index, typeIndex] = await Promise.all([getPokemonIndex(), getTypeIndex()]);
  return <PokedexClient index={index} typeIndex={serializeTypeIndex(typeIndex)} />;
}
```

`PokedexClient` is `'use client'` and owns all interactivity.

**Why this split:** Search, sort, filter, and Load More are inherently interactive — they need `useState`, so they need to be client code. But the *1010-item index* doesn't need to be fetched in the browser. Fetch it on the server (where Next caches it across all users), serialize it into the client component's props, and the browser receives the data already in the HTML.

**Why not just mark the whole page `'use client'`:** Then you'd fetch the index in a `useEffect`, meaning: a blank page on first paint, a client-side loading spinner, and no server caching. You'd have paid Next.js's complexity cost and received none of its benefits. The reviewer's question — "why Next.js and not plain React?" — needs an answer, and this is it.

**Watch out:** A `Map<string, Set<number>>` cannot cross the server/client boundary — it isn't JSON-serializable. Convert to `Record<string, number[]>` before passing. Discovering this at runtime is a confusing error; anticipate it.

**Done when:** The home page HTML contains Pokémon names when you view source with JavaScript disabled.

---

### Step 3.2 — The pipeline, as `useMemo`

**Do:** Inside `PokedexClient`:

```tsx
const [query, setQuery] = useState('');
const [sort, setSort] = useState<SortKey>('id-asc');
const [typeFilter, setTypeFilter] = useState<string | null>(null);
const [visibleCount, setVisibleCount] = useState(10);

const debouncedQuery = useDebounce(query, 300);

const filtered = useMemo(() => {
  let list = index;
  if (typeFilter) {
    const ids = new Set(typeIndex[typeFilter]);
    list = list.filter(p => ids.has(p.id));
  }
  if (debouncedQuery) {
    const q = debouncedQuery.toLowerCase().trim();
    list = list.filter(p => p.name.includes(q) || String(p.id) === q || padId(p.id) === q);
  }
  return [...list].sort(comparators[sort]);
}, [index, typeIndex, typeFilter, debouncedQuery, sort]);

const visible = filtered.slice(0, visibleCount);
```

**Why `useMemo`:** This pipeline runs over 1010 items. Without memoization it re-executes on *every* render, including ones triggered by unrelated state. With it, it recomputes only when an input actually changes. This is `useMemo` used for its actual purpose — a real computation over a real dataset — not sprinkled on decoratively.

**Why reset `visibleCount` to 10 when filters change:** If a user has loaded 100 cards and then searches, showing 100 filtered results is wrong — the spec says start at 10. Add a `useEffect` (or reset inside the setter handlers) that snaps it back. Forgetting this produces a subtle, embarrassing bug the grader *will* find by clicking around.

**Why debounce the search:** Every keystroke re-filters 1010 items and re-renders the grid. At 300 ms you filter once per pause instead of once per character. Typing "charizard" goes from 9 recomputations to 1.

**Why match `String(p.id)` *and* `padId(p.id)`:** The spec says searchable by ID. A user might type `25` or `025`. Both should work. This is a one-line accommodation that shows you thought about the user rather than the requirement.

**Done when:** Search "char" returns Charmander, Charmeleon, Charizard. Search "025" returns Pikachu. Sort by name descending puts Zygarde-ish names first. Load More adds exactly 10.

---

### Step 3.3 — Fetch details for the visible slice

**Do:** The cards need types and photos, which the index lacks. Fetch `getPokemon(id)` for each visible ID via `Promise.all`, in a `useEffect` keyed on the visible slice. Or — cleaner — make each `PokemonCard` fetch its own detail and let Next's cache dedupe.

**Prefer the batch:** one `Promise.all` per Load More, with an in-memory `Map` guarding against refetching what you already have.

**Why never `for (const id of ids) { await getPokemon(id) }`:** Ten sequential round-trips at ~150 ms each is 1.5 seconds of dead air. `Promise.all` fires all ten concurrently and finishes in ~150 ms. Same code length, ten times faster. This exact loop is the most-cited red flag in junior code review.

**Why an `AbortController` on the search path:** If a user types "cha" then "char", two request batches are in flight. If the slower "cha" batch resolves last, it overwrites the correct results with stale ones. This is a race condition, and it *will* happen on a slow connection. Abort the previous batch when a new one starts. Being able to name this bug in an interview is worth real points.

**Done when:** Load More on a throttled connection fills in cards without stale flashes, and rapid typing never leaves wrong results on screen.

---

### Step 3.4 — Card, badge, grid

**Do:** `PokemonCard` is `'use client'` (it needs `onError` for the image fallback). Wrap it in `<Link href={/pokemon/${id}}>`. Show ID (padded), name (capitalized), photo, type badges.

**Why the card is a `<Link>` and not an `onClick`:** Same reasoning as Step 2.2. It makes cards middle-clickable, right-clickable, keyboard-focusable, and prefetched — for free. An `onClick` + `router.push` gives you none of that and is more code.

**Why the image needs `onError`:** A handful of the 1010 artwork URLs will 404. Falling back to `sprites.other['official-artwork'].front_default` from the detail response means one broken image doesn't leave a hole in your grid.

**Why type badges get colors:** It is the cheapest possible visual polish. Eighteen hex values in a `Record<string, string>`, and the grid immediately stops looking like a wireframe. This is the highest visual return per minute in the entire project.

**Done when:** The grid renders 10 cards, each clickable to its detail page.

---

## Phase 4 — Hardening (Day 3 morning)

Do these **in order**. This is the checklist a reviewer runs.

1. **Open DevTools. Zero console errors, zero warnings.** Especially React's `key` warning — it means you used array indices as keys and a reviewer will notice.
2. **Empty state.** Search "zzzzz" → "No Pokémon found," not a blank void.
3. **Load More disappears** when `visibleCount >= filtered.length`. A button that does nothing is a bug.
4. **Every loading state exists.** Home skeleton, detail skeleton, and a per-card loading state while details resolve.
5. **Keyboard navigation.** Tab through the page. Can you reach every card and every control? Can you activate them with Enter? If you used `<Link>` everywhere as instructed, this works already — verify it.
6. **Responsive.** Test at 375 px, 768 px, 1440 px. A grid that overflows on mobile is the first thing anyone opening your Vercel link on a phone will see.
7. **Run `pnpm build`.** Not `pnpm dev` — `build`. It runs type-checking and lint strictly. It *will* surface errors that dev mode tolerated.

**Why hardening is its own phase:** If you fold these into feature work, you'll skip them under time pressure. Isolating them means they get done. Every item is something a grader can check in under thirty seconds — which is exactly why they check them.

---

## Phase 5 — README and deploy (Day 3 afternoon)

### Step 5.1 — The README

**Do:** Four sections.

1. **Setup** — clone, `pnpm install`, `pnpm dev`. Three lines.
2. **Live demo** — the Vercel URL, at the top, impossible to miss.
3. **Architecture** — a short paragraph plus the pipeline diagram from Step 0.4.
4. **Decisions & tradeoffs** — the important one:
   - **Full-index fetch vs. API pagination.** Explain that paginating the API breaks search and sort, and that you fetch 1010 name+ID pairs once (~60 KB, cached) to make them correct across the whole dataset.
   - **Weakness derivation.** State the spec/PokeAPI discrepancy from Step 0.3 and why you chose the API.
   - **ID capped at 1010.** State the three reasons.
   - **Server/client split.** Why the index is fetched server-side and only the interactive shell is a client component.
   - **With more time:** proper dual-type damage multipliers, virtualized grid, unit tests on the weakness resolver.

**Why the README is worth an hour of your last day:** Your code shows *what* you built. Only the README shows *why*. A reviewer skimming twenty submissions cannot reverse-engineer your reasoning from your components — but they will read four bullet points. Those bullets are where you convert "wrote a Pokédex" into "makes engineering judgments and can defend them."

The "with more time" section is not an apology. It is proof you know what a complete version looks like and chose deliberately what to cut. Every senior engineer ships against a deadline; showing you can scope is showing you can be trusted with one.

### Step 5.2 — Deploy

**Do:** Push to GitHub, import into Vercel, deploy. It's a Next.js app on Vercel — zero configuration.

**Why deploying beats one more feature:** A reviewer who has to clone your repo, install dependencies, and run it locally may simply not do it. A reviewer who clicks a link is looking at your work in three seconds. Nothing else on Day 3 has a better effort-to-impact ratio.

**Done when:** The live URL loads, you've clicked through five random Pokémon on it, and it's in your README and your submission email.

---

## The loop, compressed

Within every step above, the same cycle:

1. **Understand the data** — what comes back, what shape, what's missing.
2. **Build the boring layer** — types and functions, no UI.
3. **Render it ugly** — prove the data flows before you style anything.
4. **Handle the edges** — loading, error, empty, out-of-range.
5. **Style it** — last, and only after 1–4 hold.
6. **Commit** — one scoped commit, clear message.

Interns invert this: they style first, discover the data doesn't fit, and refactor under pressure. The order above is the entire difference.

---

## What you are actually being graded on

The spec lists features. Features are the floor — nearly every submission has most of them. You are differentiated on:

- **Separation of concerns.** Does data fetching live apart from rendering?
- **Correctness under pressure.** Does search work across all 1010, or only what's loaded?
- **The states nobody asks for.** Loading, error, empty, 404.
- **Framework fluency.** Did you use Next.js, or did you use React inside Next.js?
- **Documented judgment.** Did you notice the weakness discrepancy?
- **Incremental work.** Does your git history show a mind that decomposes problems?

Build for that list, not the spec's.
