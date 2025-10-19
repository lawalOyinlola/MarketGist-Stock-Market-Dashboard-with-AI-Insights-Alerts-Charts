"use client";

import { useCallback, useEffect, useRef } from "react";

export function useDebounce(callback: () => void, delay: number) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  callbackRef.current = callback;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current();
    }, delay);
  }, [delay]);
}
