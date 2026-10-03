"use client";

import * as React from "react";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateTimePickerProps {
  value?: string; // Format "YYYY-MM-DDTHH:mm" (comme input datetime-local)
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Sélectionner une date et heure",
  disabled = false,
  className,
  id,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Parse existing date or default to undefined
  const selectedDate = React.useMemo(() => {
    if (!value) return undefined;
    const d = new Date(value);
    return isNaN(d.getTime()) ? undefined : d;
  }, [value]);

  // Extract hours and minutes
  const hours = React.useMemo(() => {
    if (!value) return "12";
    try {
      const parts = value.split("T");
      if (parts[1]) {
        return parts[1].split(":")[0] || "12";
      }
    } catch {
      // ignore
    }
    return "12";
  }, [value]);

  const minutes = React.useMemo(() => {
    if (!value) return "00";
    try {
      const parts = value.split("T");
      if (parts[1]) {
        return parts[1].split(":")[1] || "00";
      }
    } catch {
      // ignore
    }
    return "00";
  }, [value]);

  const handleSelectDate = (date: Date | undefined) => {
    if (!date) {
      onChange("");
      return;
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    onChange(`${year}-${month}-${day}T${hours}:${minutes}`);
  };

  const handleTimeChange = (newHours: string, newMinutes: string) => {
    const baseDate = selectedDate || new Date();
    const year = baseDate.getFullYear();
    const month = String(baseDate.getMonth() + 1).padStart(2, "0");
    const day = String(baseDate.getDate()).padStart(2, "0");
    onChange(`${year}-${month}-${day}T${newHours}:${newMinutes}`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal bg-background border-input hover:bg-accent/40",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 size-4 text-muted-foreground" />
          {selectedDate ? (
            <span>
              {selectedDate.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}{" "}
              à {hours}h{minutes}
            </span>
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelectDate}
        />
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            <span>Heure :</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Select
              value={hours}
              onValueChange={(h) => handleTimeChange(h, minutes)}
            >
              <SelectTrigger className="h-8 w-16 text-xs">
                <SelectValue placeholder="HH" />
              </SelectTrigger>
              <SelectContent className="max-h-48">
                {Array.from({ length: 24 }).map((_, i) => {
                  const val = String(i).padStart(2, "0");
                  return (
                    <SelectItem key={val} value={val} className="text-xs">
                      {val} h
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <span className="text-xs font-semibold text-muted-foreground">:</span>
            <Select
              value={minutes}
              onValueChange={(m) => handleTimeChange(hours, m)}
            >
              <SelectTrigger className="h-8 w-16 text-xs">
                <SelectValue placeholder="MM" />
              </SelectTrigger>
              <SelectContent className="max-h-48">
                {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map((m) => (
                  <SelectItem key={m} value={m} className="text-xs">
                    {m} min
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
