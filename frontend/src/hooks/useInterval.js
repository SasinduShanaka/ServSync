import { useEffect, useRef } from "react";

// Reusable interval hook: runs callback every `delay` ms; pass null to stop
export default function useInterval(callback, delay) {
  const savedRef = useRef();
  useEffect(() => {
    savedRef.current = callback;
  }, [callback]);
  useEffect(() => {
    if (delay == null) return;
    const id = setInterval(() => savedRef.current && savedRef.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}
