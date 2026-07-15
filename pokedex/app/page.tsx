import Image from "next/image";

//testing sum tings

export default async function Home() {
  const p = await getPokemon(25);
  console.log(p);
  return <div> check terminal</div>;
}