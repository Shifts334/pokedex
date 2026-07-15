import { PokemonDTO, PokemonSummary } from "@/types/pokemon";
import { PokemonCard } from "./pokemon-card";

interface Props {
    index: PokemonSummary[];
    details: Map<number, PokemonDTO>;
}

export function PokemonGrid({ index, details }: Props) {
    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {index.map((p) => (
                <PokemonCard key={p.id} summary={p} detail={details.get(p.id)} />
            ))}
        </div>
    );
}
