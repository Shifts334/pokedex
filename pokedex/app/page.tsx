import { getPokemonIndex, getTypeIndex, serializeTypeIndex } from "@/lib/pokeapi";
import { PokemonClient } from "@/components/pokemon-client";


export default async function Home() {
  const [index, typeIndex] = await Promise.all([
    getPokemonIndex(),
    getTypeIndex(),
  ]);
  
  return(<PokemonClient index={index} typeIndex={serializeTypeIndex(typeIndex)} />);
}

