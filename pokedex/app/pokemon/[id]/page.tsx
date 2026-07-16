import { notFound } from "next/navigation";
import Link from "next/link";
import { getPokemon, getPokemonSpecies, toPokemon } from "@/lib/pokeapi";
import { getWeaknesses } from "@/lib/weakness";
import { MAX_POKEMON_ID } from "@/lib/constants";
import { PokemonDetailCard } from "@/components/pokemon-details";

const navLink =
    "rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition hover:border-foreground/30";
const navDisabled =
    "rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted opacity-50";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id: raw } = await params;
    const id = Number(raw);

    //input check before fetch
    if (!Number.isInteger(id) || id < 1 || id > MAX_POKEMON_ID) {
        notFound();
    }

    const [dto, species] = await Promise.all([getPokemon(id), getPokemonSpecies(id)]);

    const weaknesses = await getWeaknesses(dto.types.map((t) => t.type.name));

    const pokemon = toPokemon(dto, species, weaknesses);

    return (
        <main className="mx-auto w-full max-w-5xl px-4 py-8">
            <nav className="mb-6">
                <Link href="/" className={navLink}>
                    Back
                </Link>
            </nav>

            <PokemonDetailCard pokemon={pokemon} />

            <nav className="mx-auto mt-8 flex max-w-4xl justify-between">
                {pokemon.id > 1 ? (
                    <Link href={`/pokemon/${pokemon.id - 1}`} className={navLink}>
                        Previous
                    </Link>
                ) : (
                    <span aria-disabled="true" className={navDisabled}>
                        Previous
                    </span>
                )}

                {pokemon.id < MAX_POKEMON_ID ? (
                    <Link href={`/pokemon/${pokemon.id + 1}`} className={navLink}>
                        Next
                    </Link>
                ) : (
                    <span aria-disabled="true" className={navDisabled}>
                        Next
                    </span>
                )}
            </nav>
        </main>
    );
}
