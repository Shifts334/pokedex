import { typeColor } from "@/lib/type-colors";

export function TypeBadge({ type }: { type: string }) {
    return (
        <span
            className="rounded px-2 py-0.5 text-xs capitalize text-white"
            style={{ backgroundColor: typeColor(type) }}
        >
            {type}
        </span>
    );
}
