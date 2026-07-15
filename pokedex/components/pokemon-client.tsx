'use client'

import { useState, useMemo, useEffect } from "react";
import { PokemonSummary, SortKey } from "@/types/pokemon";
import { useDebounce } from "@/hooks/useDebounce";
import { comparators } from "@/lib/sort";
import { padId } from "@/lib/utils";

interface Props {
    index: PokemonSummary[];
    typeIndex: Record<string, number[]>;
}

export function PokemonClient({index, typeIndex}: Props){
    const [query, setQuery]=useState("");
    const [sort, setSort]=useState<SortKey>("id-asc");
    const [typeFilter, setTypeFilter] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(10);

    const debounceQuery = useDebounce(query, 300);

    const filtered = useMemo(()=>{
        let list = index; 

        if (typeFilter){
            const ids = new Set(typeIndex[typeFilter]);
            list = list.filter((p)=>ids.has(p.id));
        }

        if(debounceQuery){
            const q = debounceQuery.toLowerCase().trim();
            list = list.filter(
                (p) => p.name.includes(q) || String(p.id) === q || padId(p.id) === q );
        }

        return [...list].sort(comparators[sort]); 
    }, [index, typeIndex, typeFilter, debounceQuery, sort]);


    //pagi reset when filter changes
    useEffect(()=> {
        setVisibleCount(10);
    }, [debounceQuery, typeFilter, sort]);

    const visible = filtered.slice(0, visibleCount);

    return(
        <main>
            <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or ID"
            />
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
                <option value="id-asc">ID asc</option>
                <option value="id-desc">ID desc</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
            </select>

            <p>{filtered.length} results</p>

            <ul>
                {visible.map((p) => (
                <li key={p.id}>
                    #{padId(p.id)} {p.name}
                </li>
                ))}
            </ul>

            {visibleCount < filtered.length && (
                <button onClick={() => setVisibleCount((v) => v + 10)}>Load More</button>
            )}
        </main>
    ); 
}