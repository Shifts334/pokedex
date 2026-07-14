//shared primitives
export interface NamedAPIResource {
    name: string;
    url: string;
}

//DTO - Data Transfer Objects

// need count first so ill call the api
export interface PokemonListResponse {
    count: number;
    results: NamedAPIResource[]; //returns only name and id, brought up the concern to ms Pai, will refactor later

}

// specs mentioned to include all attributes from api
export interface PokemonDTO{
    id: number;
    name: string;
    height: number; //decimetres(!)
    weight: number; //hectograms(!)
    types: { slot: number; type: NamedAPIResource }[];
    stats: {base_stat: number; stat: NamedAPIResource}[];
    abilities: { is_hidden: boolean; ability: NamedAPIResource}[];
    sprites: {
        front_default: string | null;
        other: {
            "official-artwork": {front_default: string | null};
        };
    };
}


export interface PokemonSpeciesDTO {
    genera: {genus: string; language: NamedAPIResource} [];
    flavor_text_entries: {flavor_text: string; language: NamedAPIResource}[];
}

//damage type relationships 
export interface TypeDTO {
    name: string;
    damage_relations: {
        double_damage_from: NamedAPIResource[];
    };
    pokemon: { pokemon: NamedAPIResource}[];
}


// Domain Models 
export interface PokemonSummary{
    id: number;
    name: string;
}

export interface Pokemon{
    id:number;
    name:string;
    heightM:number;
    weightKg:number;
    types:string[];
    category:string;
    description:string;
    stats: {name: string; value: number}[];
    abilities: string[]
    artworkUrl:string;
    spriteFallback: string | null;
    weaknesses:string[];
}