"use client";

import * as React from "react";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface PasswordInputProps
  extends Omit<React.ComponentProps<typeof Input>, "type"> {
  startIcon?: React.ReactNode;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, startIcon, disabled, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="relative w-full">
        {startIcon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {startIcon}
          </div>
        )}
        <Input
          {...props}
          id={id}
          ref={ref}
          type={showPassword ? "text" : "password"}
          disabled={disabled}
          className={cn(
            startIcon && "pl-9",
            "pr-10", // Espace pour le bouton œil
            className
          )}
        />
        <button
          type="button"
          tabIndex={0}
          onClick={() => setShowPassword((prev) => !prev)}
          disabled={disabled}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          aria-label={
            showPassword
              ? "Masquer le mot de passe"
              : "Afficher le mot de passe en clair"
          }
          title={
            showPassword
              ? "Masquer le mot de passe"
              : "Afficher le mot de passe"
          }
        >
          {showPassword ? (
            <EyeOff className="size-4 shrink-0" aria-hidden="true" />
          ) : (
            <Eye className="size-4 shrink-0" aria-hidden="true" />
          )}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;
