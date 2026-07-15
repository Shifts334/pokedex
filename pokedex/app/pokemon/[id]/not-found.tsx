import Link from "next/link";

export default function NotFound() {
    return(
        <main>
            <h2>Pokemon not found</h2>
            <p>id not found in Pokdex (range from 1-1010)</p>
            <Link href= "/">return to pokedex</Link>
        </main>
    );
}