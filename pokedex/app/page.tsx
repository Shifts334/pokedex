import { getPokemonIndex } from "@/lib/pokeapi";

//testing sum tings

export default async function Home() {
  const p = await getPokemonIndex(25);
  console.log(p);
  return <div> check terminal</div>;
}