'use client'

import { useState, useMemo, useEffect, useRef } from "react";
import { PokemonDTO, PokemonSummary, SortKey } from "@/types/pokemon";
import { useDebounce } from "@/hooks/useDebounce";
import { comparators } from "@/lib/sort";
import { getPokemon } from "@/lib/pokeapi";
import { padId } from "@/lib/utils";
import { PokemonGrid } from "./pokemon-grid";

interface Props {
    index: PokemonSummary[];
    typeIndex: Record<string, number[]>;
}

// client for display
export function PokemonClient({ index, typeIndex }: Props) {
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState<SortKey>("id-asc");
    const [typeFilter, setTypeFilter] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(10);
    const [details, setDetails] = useState<Map<number, PokemonDTO>>(new Map());

    const fetchedIds = useRef<Set<number>>(new Set());
    const debounceQuery = useDebounce(query, 300);

    const filtered = useMemo(() => {
        let list = index;

        if (typeFilter) {
            const ids = new Set(typeIndex[typeFilter]);
            list = list.filter((p) => ids.has(p.id));
        }

        if (debounceQuery) {
            const q = debounceQuery.toLowerCase().trim();
            list = list.filter(
                (p) => p.name.includes(q) || String(p.id) === q || padId(p.id) === q
            );
        }

        return [...list].sort(comparators[sort]);
    }, [index, typeIndex, typeFilter, debounceQuery, sort]);

    const visible = filtered.slice(0, visibleCount);
    const visibleKey = visible.map((p) => p.id).join(",");

  
    useEffect(() => {
        const controller = new AbortController();

        const missing = visible.filter((p) => !fetchedIds.current.has(p.id));
        if (missing.length === 0) return;

        missing.forEach((p) => fetchedIds.current.add(p.id));

        Promise.all(
            missing.map((p) => getPokemon(p.id, { signal: controller.signal }))
        )
            .then((results) => {
                setDetails((prev) => {
                    const next = new Map(prev);
                    results.forEach((d) => next.set(d.id, d));
                    return next;
                });
            })
            .catch((e) => {
                if ((e as Error).name !== "AbortError") {
                    
                    missing.forEach((p) => fetchedIds.current.delete(p.id));
                    console.error(e);
                }
            });

        return () => controller.abort();
    }, [visibleKey]);

    // pagi resets when filter changes
    function handleSearch(value: string) {
        setQuery(value);
        setVisibleCount(10);
    }

    function handleSort(value: SortKey) {
        setSort(value);
        setVisibleCount(10);
    }

    
    return (
        <main className="mx-auto w-full max-w-5xl px-4 py-8">
            <h1 className="text-2xl font-semibold tracking-tight">Pokedex</h1>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <input
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search by name or ID"
                    className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-foreground/30 sm:max-w-xs"
                />
                <select
                    value={sort}
                    onChange={(e) => handleSort(e.target.value as SortKey)}
                    className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
                >
                    <option value="id-asc">ID asc</option>
                    <option value="id-desc">ID desc</option>
                    <option value="name-asc">Name A-Z</option>
                    <option value="name-desc">Name Z-A</option>
                </select>
            </div>

            <p className="mt-3 text-sm text-muted">{filtered.length} results</p>

            <div className="mt-6">
                <PokemonGrid index={visible} details={details} />
            </div>

            {visibleCount < filtered.length && (
                <div className="mt-8 flex justify-center">
                    <button
                        onClick={() => setVisibleCount((v) => v + 10)}
                        className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition hover:border-foreground/30"
                    >
                        Load More
                    </button>
                </div>
            )}
        </main>
    );
}