import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { APIError } from "./errors/generalErrors";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Correctly handle client-side errors with translations and fallbacks.
 *
 * @param error The error to handle.
 * @param errorT A translation function for error messages.
 */
export function handleClientError(error: unknown, errorT: (key: string) => string) {
  if (error instanceof APIError) {
    const data = error.jsonData as { error?: string; translationKey?: string };
    alert(data.translationKey ? errorT(data.translationKey) : data.error || errorT("errors.unknownError"));
  } else {
    console.error(error);
    alert(errorT("errors.unknownError"));
  }
}
