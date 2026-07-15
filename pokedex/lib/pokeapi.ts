import { PokemonDTO, PokemonSpeciesDTO, TypeDTO, PokemonListResponse, Pokemon, PokemonSummary } from "@/types/pokemon";
import {artworkUrl} from "./utils";
import { BASE_URL, MAX_POKEMON_ID } from "./constants";

const BASE = "https://pokeapi.co/api/v2";


// fetch wrapper
async function fetchJson<T>(url: string): Promise<T> {
    const res = await fetch(url, {next: {revalidate: false} });
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

export async function getPokemon(id: number): Promise<PokemonDTO> {
    return fetchJson<PokemonDTO>(`${BASE_URL}/pokemon/${id}/`);
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


//export async function getTypeIndex()
// build it in a bit

