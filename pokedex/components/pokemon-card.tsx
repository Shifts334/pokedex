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
            className="flex flex-col items-center gap-1 rounded-lg border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-md"
        >
            <Image
                src={src}
                alt={summary.name}
                width={120}
                height={120}
                onError={() => setFailed(true)}
            />
            <span className="text-sm text-muted">#{padId(summary.id)}</span>
            <span className="font-medium capitalize">{summary.name}</span>

            <div className="flex h-6 gap-1">
                {detail?.types.map((t) => (
                    <TypeBadge key={t.type.name} type={t.type.name} />
                ))}
            </div>
        </Link>
    );
}
