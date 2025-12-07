// CSV Export Utilities

export function downloadCSV(filename: string, csvContent: string) {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) return '';
  
  const stringValue = String(value);
  
  // If the value contains comma, quote, or newline, wrap it in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

export function arrayToCSV(headers: string[], rows: any[][]): string {
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.map(escapeCSVValue).join(','));
  
  // Add data rows
  for (const row of rows) {
    csvRows.push(row.map(escapeCSVValue).join(','));
  }
  
  return csvRows.join('\n');
}

// Export oils inventory
export function exportOilsToCSV(items: any[]) {
  const headers = ['Type', 'Quantité', 'Unité', 'Seuil Alerte', 'Date', 'Utilisateur'];
  const rows = items.map(item => [
    item.type,
    item.qty,
    item.unit,
    item.alert,
    item.date,
    item.user
  ]);
  
  const csv = arrayToCSV(headers, rows);
  const filename = `Huiles_et_Graisses_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(filename, csv);
}

// Export chemicals inventory
export function exportChemicalsToCSV(items: any[]) {
  const headers = ['Nom', 'Quantité', 'Unité', 'Seuil Alerte', 'Date', 'Utilisateur'];
  const rows = items.map(item => [
    item.nom,
    item.qty,
    item.unit,
    item.alert,
    item.date,
    item.user
  ]);
  
  const csv = arrayToCSV(headers, rows);
  const filename = `Bentonite_et_Chimie_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(filename, csv);
}

// Export spare parts inventory
export function exportPartsToCSV(items: any[]) {
  const headers = ['Description', 'Catégorie', 'Quantité', 'Localisation', 'Seuil Alerte', 'Date', 'Utilisateur'];
  const rows = items.map(item => [
    item.des,
    item.cat,
    item.qty,
    item.loc,
    item.alert,
    item.date,
    item.user
  ]);
  
  const csv = arrayToCSV(headers, rows);
  const filename = `Stock_Materiel_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(filename, csv);
}

// Export output/delivery records
export function exportOutputToCSV(items: any[]) {
  const headers = ['Date', 'Matériel', 'Quantité', 'Destination', 'Réceptionnaire', 'Utilisateur'];
  const rows = items.map(item => [
    item.date,
    item.nom,
    item.qty,
    item.dest,
    item.rec,
    item.user
  ]);
  
  const csv = arrayToCSV(headers, rows);
  const filename = `Sortie_Materiel_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(filename, csv);
}

// Export diesel consumption records
export function exportDieselToCSV(entries: any[]) {
  const headers = ['Date', 'Heure', 'Machine', 'Shift', 'Consommation (L)', 'Utilisateur'];
  const rows = entries.map(entry => [
    entry.date,
    entry.time,
    entry.mac,
    entry.sh,
    entry.conso,
    entry.user
  ]);
  
  const csv = arrayToCSV(headers, rows);
  const filename = `Consommation_Gasoil_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(filename, csv);
}

// Export activity log
export function exportActivityToCSV(activities: any[]) {
  const headers = ['Date', 'Heure', 'Action', 'Détails', 'Utilisateur'];
  const rows = activities.map(activity => [
    activity.date,
    activity.time || '',
    activity.action,
    activity.details,
    activity.user
  ]);
  
  const csv = arrayToCSV(headers, rows);
  const filename = `Historique_Activites_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(filename, csv);
}

// Export low stock items
export function exportLowStockToCSV(items: any[]) {
  const headers = ['Type', 'Nom/Description', 'Quantité', 'Unité', 'Seuil Alerte', 'Catégorie', 'Date'];
  const rows = items.map(item => [
    item.type,
    item.name,
    item.qty,
    item.unit,
    item.alert,
    item.category,
    item.date
  ]);
  
  const csv = arrayToCSV(headers, rows);
  const filename = `Alertes_Stock_Bas_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(filename, csv);
}
