export const padId = (id:number) => String(id).padStart(3, "0");

export const artworkUrl = (id:number) => `https://assets.pokemon.com/assets/cms2/img/pokedex/full/${padId(id)}.png`;
