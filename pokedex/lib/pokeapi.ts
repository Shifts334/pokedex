import { PokemonDTO, PokemonSpeciesDTO, Pokemon, PokemonSummary } from "@/types/pokemon";
import { describe } from "node:test";

function toPokemon (
    dto:PokemonDTO,
    species: PokemonSpeciesDTO,
    weaknesses: string[]
): Pokemon {
    return{
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
        abilities: dto.abilities.map(a=> a.ability.name),
        artworkUrl: artworkUrl(dto.id), 
        spriteFallback:
            dto.sprites.other["official-artwork"].front_default ??
            dto.sprites.front_default,
        weaknesses,
        
    }
}

export async function getPokemonIndex(): Promise<PokemonSummary[]> {
    const data = await fetchJson<PokemonListResponse>(
        '${BASE}/pokemon/?limit=${MAX_POKEMON_ID}'
    );

    return data.results.map((r,i)=>({
        id: i+1,
        name:r.name,
    }));
}

const id = Number(r.url.split("/").filter(Boolean).pop());

