import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer); // cancel if value changes before delay elapses
    }, [value, delay]);

    return debounced;
}