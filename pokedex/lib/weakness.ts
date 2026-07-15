import { getType } from "./pokeapi";

export async function getWeaknesses(typeNames: string[]): Promise<string[]> {
    const types = await Promise.all(typeNames.map(getType));
    const weaknesses = new Set<string>();
    for (const t of types){
        for (const rel of t.damage_relations.double_damage_from){
            weaknesses.add(rel.name);
        }
    }
    return [...weaknesses];
}
