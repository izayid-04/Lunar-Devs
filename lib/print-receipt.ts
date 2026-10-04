import type { CitizenMessage } from "@/lib/api";

export function printReceipt(message: CitizenMessage) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    if (typeof window !== "undefined") {
      window.print();
    }
    return;
  }

  const statusLabel =
    message.status === "traite"
      ? "Traité"
      : message.status === "en_cours"
      ? "En cours"
      : "Nouveau";

  const dateFormatted = new Date(message.createdAt).toLocaleString("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  });

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Accusé de réception — ${message.reference}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 24px;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #ea580c;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .title-area h1 {
      margin: 0;
      font-size: 22px;
      color: #ea580c;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .title-area p {
      margin: 4px 0 0 0;
      font-size: 13px;
      color: #64748b;
    }
    .badge-ref {
      text-align: right;
    }
    .ref-val {
      font-family: monospace;
      font-size: 18px;
      font-weight: bold;
      color: #0f172a;
    }
    .badge-status {
      display: inline-block;
      margin-top: 4px;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      background: #fff7ed;
      color: #c2410c;
      border: 1px solid #ffedd5;
    }
    .card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 24px;
      background-color: #f8fafc;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 140px 1fr;
      row-gap: 12px;
      column-gap: 16px;
      font-size: 14px;
    }
    .label {
      font-weight: 600;
      color: #475569;
    }
    .value {
      color: #0f172a;
    }
    .content-block {
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
      margin-top: 16px;
    }
    .content-body {
      white-space: pre-wrap;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 14px;
      font-size: 13.5px;
      color: #334155;
      margin-top: 6px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px dashed #cbd5e1;
      font-size: 12px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .official-seal {
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
      color: #ea580c;
      border: 1px solid #ea580c;
      padding: 4px 8px;
      border-radius: 4px;
      display: inline-block;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title-area">
      <h1>Accusé de réception</h1>
      <p>Services Municipaux & Administration Numérique — Ville de Nova Terra</p>
    </div>
    <div class="badge-ref">
      <div class="ref-val">${message.reference}</div>
      <div class="badge-status">${statusLabel}</div>
    </div>
  </div>

  <div class="card">
    <div class="info-grid">
      <div class="label">Date d'émission :</div>
      <div class="value">${dateFormatted}</div>

      <div class="label">Objet :</div>
      <div class="value"><strong>${message.subject}</strong></div>

      <div class="label">Service / Catégorie :</div>
      <div class="value">${message.category} ${message.type === "signalement" ? "(Signalement d'incident)" : "(Démarche citoyenne)"}</div>

      ${message.district ? `
      <div class="label">Quartier & Lieu :</div>
      <div class="value">${message.district} ${message.preciseLocation ? `— ${message.preciseLocation}` : ""}</div>
      ` : ""}

      <div class="label">Statut actuel :</div>
      <div class="value">${statusLabel}</div>
    </div>

    <div class="content-block">
      <div class="label">Contenu transmis :</div>
      <div class="content-body">${message.body.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
    </div>
  </div>

  <div class="footer">
    <div>
      Accusé de dépôt officiel généré électroniquement.<br />
      Conservez ce récépissé avec la référence <strong>${message.reference}</strong> pour le suivi de votre dossier.
    </div>
    <div class="official-seal">
      Récépissé Officiel Nova Terra
    </div>
  </div>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
