"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Flame, ArrowUp, ArrowDown, Minus } from "lucide-react";
import type { CitizenMessage, MessagePriority } from "@/lib/api";

export function getMessageEffectivePriority(message: Pick<CitizenMessage, "priority" | "isMedicalEmergency" | "subject">): MessagePriority {
  if (message.priority) return message.priority;
  if (message.isMedicalEmergency || message.subject?.toLowerCase().includes("urgence")) {
    return "urgente";
  }
  return "normale";
}

export function isMedicalEmergencyMessage(message: Pick<CitizenMessage, "isMedicalEmergency" | "subject" | "category">): boolean {
  return Boolean(
    message.isMedicalEmergency ||
    message.subject?.toLowerCase().includes("urgence médicale") ||
    message.category?.toLowerCase().includes("santé & urgences")
  );
}

interface PriorityBadgeProps {
  message: Pick<CitizenMessage, "priority" | "isMedicalEmergency" | "subject" | "category">;
  className?: string;
  showIcon?: boolean;
}

export function PriorityBadge({ message, className = "", showIcon = true }: PriorityBadgeProps) {
  const isMed = isMedicalEmergencyMessage(message);
  const priority = getMessageEffectivePriority(message);

  if (isMed) {
    return (
      <Badge
        variant="destructive"
        className={`gap-1 font-semibold text-[11px] px-2 py-0.5 animate-pulse bg-destructive text-destructive-foreground ${className}`}
      >
        {showIcon && <AlertCircle className="size-3 shrink-0" />}
        <span>Urgence médicale</span>
      </Badge>
    );
  }

  switch (priority) {
    case "urgente":
      return (
        <Badge
          variant="outline"
          className={`gap-1 font-semibold text-[11px] px-2 py-0.5 border-destructive/50 text-destructive bg-destructive/10 ${className}`}
        >
          {showIcon && <Flame className="size-3 shrink-0" />}
          <span>Urgente</span>
        </Badge>
      );
    case "haute":
      return (
        <Badge
          variant="outline"
          className={`gap-1 font-medium text-[11px] px-2 py-0.5 border-amber-500/50 text-amber-600 bg-amber-500/10 ${className}`}
        >
          {showIcon && <ArrowUp className="size-3 shrink-0" />}
          <span>Haute</span>
        </Badge>
      );
    case "basse":
      return (
        <Badge
          variant="outline"
          className={`gap-1 font-normal text-[11px] px-2 py-0.5 text-muted-foreground border-border bg-muted/30 ${className}`}
        >
          {showIcon && <ArrowDown className="size-3 shrink-0" />}
          <span>Basse</span>
        </Badge>
      );
    case "normale":
    default:
      return (
        <Badge
          variant="outline"
          className={`gap-1 font-normal text-[11px] px-2 py-0.5 text-muted-foreground border-border bg-muted/20 ${className}`}
        >
          {showIcon && <Minus className="size-3 shrink-0" />}
          <span>Normale</span>
        </Badge>
      );
  }
}
