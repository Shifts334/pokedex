import { PokemonSummary, SortKey } from "@/types/pokemon";

export const comparators: Record<SortKey,(a: PokemonSummary, b: PokemonSummary) => number> = {
    "id-asc": (a, b) => a.id - b.id,
    "id-desc": (a, b) => b.id - a.id,
    "name-asc": (a, b) => a.name.localeCompare(b.name),
    "name-desc": (a, b) => b.name.localeCompare(a.name),
};