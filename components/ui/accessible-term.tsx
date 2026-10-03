"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// D13 : explication courte d'un terme propre à Nova Terra (Dôme, Maglev…).
// Le déclencheur est un vrai bouton : atteignable au clavier (Tab), l'infobulle
// s'ouvre au focus comme au survol, et Radix relie le texte via
// aria-describedby pour les lecteurs d'écran.
export default function AccessibleTerm({
  term,
  definition,
}: {
  term: string;
  definition: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="cursor-help rounded-sm underline decoration-dotted underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {term}
          <span className="sr-only"> : {definition}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[16rem] text-center">
        {definition}
      </TooltipContent>
    </Tooltip>
  );
}
