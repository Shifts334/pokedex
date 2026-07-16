import Image from "next/image";
import { Pokemon } from "@/types/pokemon";
import { typeColor } from "@/lib/type-colors";
import { padId } from "@/lib/utils";
import { TypeBadge } from "./type-badge";

const MAX_STAT = 255;

export function PokemonDetailCard({ pokemon }: { pokemon: Pokemon }) {
    const [primary, secondary] = pokemon.types;

    return (
        <article
            className="pokemon-detail"
            data-type={primary}
            style={{
                "--type": typeColor(primary),
                "--type-2": typeColor(secondary ?? primary),
            } as React.CSSProperties}
        >
            <div className="pokemon-detail__hero">
                <span className="pokemon-detail__id">#{padId(pokemon.id)}</span>
                <Image
                    src={pokemon.artworkUrl}
                    alt={pokemon.name}
                    width={300}
                    height={300}
                    priority
                />
            </div>

            <div className="pokemon-detail__body">
                <header className="pokemon-detail__header">
                    <h1>{pokemon.name}</h1>
                    <p className="pokemon-detail__category">{pokemon.category}</p>
                    <div className="pokemon-detail__types">
                        {pokemon.types.map((t) => (
                            <TypeBadge key={t} type={t} />
                        ))}
                    </div>
                </header>

                <p className="pokemon-detail__flavor">{pokemon.description}</p>

                <dl className="pokemon-detail__facts">
                    <div>
                        <dt>Height</dt>
                        <dd>{pokemon.heightM} m</dd>
                    </div>
                    <div>
                        <dt>Weight</dt>
                        <dd>{pokemon.weightKg} kg</dd>
                    </div>
                </dl>

                <section className="pokemon-detail__section">
                    <h2>Weaknesses</h2>
                    <div className="pokemon-detail__types">
                        {pokemon.weaknesses.map((w) => (
                            <TypeBadge key={w} type={w} />
                        ))}
                    </div>
                </section>

                <section className="pokemon-detail__section">
                    <h2>Stats</h2>
                    <ul className="pokemon-detail__stats">
                        {pokemon.stats.map((s) => (
                            <li
                                key={s.name}
                                style={{ "--fill": `${(s.value / MAX_STAT) * 100}%` } as React.CSSProperties}
                            >
                                <span className="stat__name">{s.name}</span>
                                <span className="stat__value">{s.value}</span>
                                <span className="stat__bar" aria-hidden="true" />
                            </li>
                        ))}
                    </ul>
                </section>
            </div>
        </article>
    );
}