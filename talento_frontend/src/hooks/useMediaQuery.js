import { useState, useEffect } from "react";

export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    // Establecemos el estado inicial
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    // Listener para actualizar el estado cuando cambie el tamaño
    const listener = () => setMatches(media.matches);
    
    // Compatibilidad multiplataforma (moderno y antiguo)
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    } else {
      media.addListener(listener); // Fallback navegadores antiguos
      return () => media.removeListener(listener);
    }
  }, [matches, query]);

  return matches;
}