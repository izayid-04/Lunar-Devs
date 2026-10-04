"use client";

import React, { useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export interface CsvColumn<T> {
  id: string;
  label: string;
  getValue: (item: T) => string | number | boolean | null | undefined;
  defaultSelected?: boolean;
}

interface ExportCsvButtonProps<T> {
  data: T[] | null | undefined;
  columns: CsvColumn<T>[];
  filename?: string;
  buttonLabel?: string;
  className?: string;
}

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

export function ExportCsvButton<T>({
  data,
  columns,
  filename = "export-novaterra.csv",
  buttonLabel = "Exporter (CSV)",
  className = "",
}: ExportCsvButtonProps<T>) {
  const [open, setOpen] = useState(false);
  const [selectedColumnIds, setSelectedColumnIds] = useState<string[]>(() =>
    columns.filter((c) => c.defaultSelected !== false).map((c) => c.id)
  );

  function toggleColumn(colId: string) {
    setSelectedColumnIds((prev) =>
      prev.includes(colId) ? prev.filter((id) => id !== colId) : [...prev, colId]
    );
  }

  function handleSelectAll() {
    setSelectedColumnIds(columns.map((c) => c.id));
  }

  function handleDeselectAll() {
    setSelectedColumnIds([]);
  }

  function handleExport() {
    if (!data || data.length === 0) {
      toast.error("Aucune donnée à exporter.");
      return;
    }

    const activeColumns = columns.filter((c) => selectedColumnIds.includes(c.id));
    if (activeColumns.length === 0) {
      toast.error("Veuillez sélectionner au moins une colonne à exporter.");
      return;
    }

    // En-têtes CSV
    const headers = activeColumns.map((c) => escapeCsvCell(c.label)).join(";");

    // Lignes CSV
    const rows = data.map((item) =>
      activeColumns
        .map((c) => {
          const val = c.getValue(item);
          return escapeCsvCell(val);
        })
        .join(";")
    );

    // BOM UTF-8 (\uFEFF) pour compatibilité Excel
    const csvContent = "\uFEFF" + [headers, ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`${data.length} ligne(s) exportée(s) avec succès.`);
    setOpen(false);
  }

  const isDataEmpty = !data || data.length === 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isDataEmpty}
          className={`h-8 gap-1.5 text-xs ${className}`}
        >
          <FileSpreadsheet className="size-3.5 text-primary" />
          <span>{buttonLabel}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="size-5 text-primary" />
            Exporter les données en CSV
          </DialogTitle>
          <DialogDescription>
            Choisissez les colonnes à inclure dans votre fichier tableur (.csv).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">
              {data?.length || 0} enregistrement(s) prêt(s)
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-primary hover:underline"
              >
                Tout cocher
              </button>
              <span className="text-muted-foreground">·</span>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="text-muted-foreground hover:underline"
              >
                Tout décocher
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto rounded-lg border border-border p-3 bg-muted/20">
            {columns.map((col) => {
              const isChecked = selectedColumnIds.includes(col.id);
              return (
                <label
                  key={col.id}
                  className="flex items-center gap-2.5 p-1.5 rounded hover:bg-muted/50 cursor-pointer text-xs font-medium"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleColumn(col.id)}
                    className="size-3.5 rounded border-input text-primary accent-primary"
                  />
                  <span className={isChecked ? "text-foreground" : "text-muted-foreground"}>
                    {col.label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button size="sm" onClick={handleExport} className="gap-2">
            <Download className="size-3.5" />
            Télécharger le CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
