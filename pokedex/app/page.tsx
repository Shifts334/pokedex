import { getPokemon, getPokemonSpecies, toPokemon } from "@/lib/pokeapi";
import { getWeaknesses } from "@/lib/weakness";

//testing sum tings

export default async function Home() {
  const [dto, species] = await Promise.all([
    getPokemon(25),
    getPokemonSpecies(25),
  ]);
const weaknesses = await getWeaknesses(dto.types.map((t)=>t.type.name));
const p = toPokemon(dto, species, weaknesses);
console.log(p);
return <div>check terminal</div>
}

