import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getPokemon,getPokemonSpecies, toPokemon,}from "@/lib/pokeapi";
import { getWeaknesses } from "@/lib/weakness";
import { MAX_POKEMON_ID } from "@/lib/constants";
import { padId } from "@/lib/utils";

export default async function Page({params,}: {params:Promise<{id:string}>}){
    const { id:raw} = await params;
    const id = Number(raw);

        //input check before fetch
        if(!Number.isInteger(id) || id <1 || id > MAX_POKEMON_ID){
            notFound();
        }


    const [dto, species] = await Promise.all([
        getPokemon(id),
        getPokemonSpecies(id),
    ]);

    const weaknesses = await getWeaknesses(dto.types.map((t)=> t.type.name));

    const pokemon = toPokemon(dto, species, weaknesses);

    return(
        <main>
            <nav>
                <Link href="/"> Back </Link>
            </nav>

            <header>
                <span>#{padId(pokemon.id)}</span>
                <h1>{pokemon.name}</h1>
                <p>{pokemon.category}</p>
            </header>

            <Image
                src={pokemon.artworkUrl}
                alt={pokemon.name}
                width={300}
                height={300}
                priority
            />

            <section>
                <p>Height: {pokemon.heightM} m</p>
                <p>Weight: {pokemon.weightKg} kg</p>
            </section>

            <section>
                <h2>Types</h2>
                {pokemon.types.map((t) => (
                <span key={t}>{t}</span>
                ))}
            </section>

            <section>
                <h2>Weaknesses</h2>
                {pokemon.weaknesses.map((w) => (
                <span key={w}>{w}</span>
                ))}
            </section>

            <section>
                <h2>Stats</h2>
                {pokemon.stats.map((s) => (
                <div key={s.name}>
                    {s.name}: {s.value}
                </div>
                ))}
            </section>

            <nav>
                {pokemon.id > 1 ? (<Link href={`/pokemon/${pokemon.id - 1}`}>Previous</Link>): 
                (
                <span aria-disabled="true">Previous</span>
                )}

                {pokemon.id < MAX_POKEMON_ID ? (
                    <Link href={`/pokemon/${pokemon.id + 1}`}>Next</Link>
                ) : (
                    <span aria-disabled="true">Next</span>
                )}
            </nav>

        </main>
    )
    
}