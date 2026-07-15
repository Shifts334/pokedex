import { PokemonDTO, PokemonSpeciesDTO, TypeDTO, PokemonListResponse, Pokemon, PokemonSummary } from "@/types/pokemon";
import {artworkUrl} from "./utils";
import { BASE_URL, MAX_POKEMON_ID } from "./constants";

const BASE = "https://pokeapi.co/api/v2";


// fetch wrapper
async function fetchJson<T>(url: string, opts?: { signal?: AbortSignal }): Promise<T> {
    const res = await fetch(url, {next: {revalidate: false}, signal: opts?.signal });
    if (!res.ok) throw new Error(`PokeAPI ${res.status} for ${url}`);
    return res.json() as Promise<T>
}

//fetchers
export async function getPokemonIndex(): Promise<PokemonSummary[]> {
    const data = await fetchJson<PokemonListResponse>(
        `${BASE_URL}/pokemon/?limit=${MAX_POKEMON_ID}`
    );

    return data.results.map((r,i)=>({
        id: Number(r.url.split("/").filter(Boolean).pop()),
        name:r.name,
    }));
}

export async function getPokemon(id: number, opts?: { signal?: AbortSignal }): Promise<PokemonDTO> {
    return fetchJson<PokemonDTO>(`${BASE_URL}/pokemon/${id}/`, opts);
}

export async function getPokemonSpecies(id:number): Promise<PokemonSpeciesDTO> {
    return fetchJson<PokemonSpeciesDTO>(`${BASE_URL}/pokemon-species/${id}/`);
}

export async function getType(name: string): Promise<TypeDTO> {
    return fetchJson<TypeDTO>(`${BASE_URL}/type/${name}/`);
}

// Domain models
export function toPokemon (
    dto:PokemonDTO,
    species: PokemonSpeciesDTO,
    weaknesses: string[]
): Pokemon {
    return {
        id: dto.id,
        name: dto.name,
        heightM: dto.height / 10,
        weightKg: dto.weight / 10,
        types: dto.types.map(t=>t.type.name),
        category:
            species.genera.find(g=>g.language.name === "en")?.genus ?? "Unknown",  
        description:
            species.flavor_text_entries.find(f=>f.language.name === "en")?.flavor_text.replace
            (/[\n\f\r]/g, " ").trim() ?? "", 
        stats: dto.stats.map(s=> ({name: s.stat.name, value: s.base_stat})),
        artworkUrl: artworkUrl(dto.id), 
        spriteFallback:
            dto.sprites.other["official-artwork"].front_default ??
            dto.sprites.front_default,
        weaknesses,
        
    }
}


export async function getTypeIndex(): Promise<Map<string, Set<number>>> {
    const typeList = await fetchJson<{ results: { name: string }[] }>(`${BASE_URL}/type/`);

    const realTypes = typeList.results.filter((t)=> t.name !== "unknown" && t.name !== "shadow");
    
    const entries = await Promise.all(
        realTypes.map(async (t)=>{
            const data = await getType(t.name);
            const ids = new Set(
                data.pokemon.map((p) => Number(p.pokemon.url.split("/").filter(Boolean).pop()))
                .filter((id)=>id <= MAX_POKEMON_ID)
            );
            return [t.name, ids] as const;
            })
    );

    return new Map(entries);
}

export function serializeTypeIndex(
    index: Map<string, Set<number>>): 
    Record<string, number[]> {
        const out: Record<string, number[]> = {};
        for (const [type, ids] of index) {
            out[type] = [...ids];
        }
        return out;
    }
