'use client'

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { PokemonDTO, PokemonSummary } from "@/types/pokemon";
import { artworkUrl, padId } from "@/lib/utils";
import { TypeBadge } from "./type-badge";

interface Props {
    summary: PokemonSummary;
    detail?: PokemonDTO; 
}

export function PokemonCard({ summary, detail }: Props) {
    const [failed, setFailed] = useState(false);

    const fallback =
        detail?.sprites.other["official-artwork"].front_default ??
        detail?.sprites.front_default ??
        null;

    
    const src = failed && fallback ? fallback : artworkUrl(summary.id);

    return (
        <Link
            href={`/pokemon/${summary.id}`}
            className="flex flex-col items-center gap-1 rounded border p-4"
        >
            <Image
                src={src}
                alt={summary.name}
                width={120}
                height={120}
                onError={() => setFailed(true)}
            />
            <span className="text-sm opacity-60">#{padId(summary.id)}</span>
            <span className="capitalize">{summary.name}</span>

            <div className="flex h-6 gap-1">
                {detail?.types.map((t) => (
                    <TypeBadge key={t.type.name} type={t.type.name} />
                ))}
            </div>
        </Link>
    );
}
