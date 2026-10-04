import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Злиття класів: clsx збирає умовні, twMerge знімає конфлікти Tailwind
 *  (напр. `p-2 p-4` -> `p-4`). Це очікує кожен компонент shadcn. */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
