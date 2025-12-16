/**
 * Worked Hours Controller
 * 
 * Handles HTTP requests for manual time tracking.
 */

import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import * as workedHoursService from '../services/worked-hours.service';
import * as settingsService from '../services/settings.service';
import { sendError, sendSuccess, sendValidationError } from '../utils/response.utils';
import { WorkedHoursMonthlyReport, WorkedHoursReportEntry, WorkedHoursGroupedEntry } from '../models/WorkedHours.model';

type PdfDocInstance = InstanceType<typeof PDFDocument>;

export async function listWorkedHours(req: Request, res: Response): Promise<void> {
  try {
    const { month, clientId } = req.query;
    const clientIdNum = clientId ? parseInt(clientId as string) : undefined;
    const records = await workedHoursService.getWorkedHours(month as string | undefined, clientIdNum);
    sendSuccess(res, records);
  } catch (error) {
    console.error('Errore durante il recupero delle ore lavorate:', error);
    sendError(res, 'Impossibile recuperare le ore lavorate');
  }
}

export async function createWorkedHours(req: Request, res: Response): Promise<void> {
  try {
    const { client_id, worked_date, hours, note } = req.body;

    const clientId = parseInt(client_id);
    if (isNaN(clientId)) {
      sendValidationError(res, 'Cliente non valido');
      return;
    }

    if (!worked_date) {
      sendValidationError(res, 'La data è obbligatoria');
      return;
    }

    const hoursValue = parseFloat(hours);
    if (isNaN(hoursValue) || hoursValue <= 0) {
      sendValidationError(res, 'Le ore devono essere un numero maggiore di zero');
      return;
    }

    const record = await workedHoursService.logWorkedHours({
      client_id: clientId,
      worked_date,
      hours: hoursValue,
      note
    });

    sendSuccess(res, record);
  } catch (error) {
    console.error('Errore durante il salvataggio delle ore lavorate:', error);
    sendError(res, 'Impossibile salvare le ore lavorate');
  }
}

export async function updateWorkedHours(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      sendValidationError(res, 'ID non valido');
      return;
    }

    const { client_id, worked_date, hours, note } = req.body;

    const updateData: any = {};

    if (client_id !== undefined) {
      const clientId = parseInt(client_id);
      if (isNaN(clientId)) {
        sendValidationError(res, 'Cliente non valido');
        return;
      }
      updateData.client_id = clientId;
    }

    if (worked_date !== undefined) {
      updateData.worked_date = worked_date;
    }

    if (hours !== undefined) {
      const hoursValue = parseFloat(hours);
      if (isNaN(hoursValue) || hoursValue <= 0) {
        sendValidationError(res, 'Le ore devono essere un numero maggiore di zero');
        return;
      }
      updateData.hours = hoursValue;
    }

    if (note !== undefined) {
      updateData.note = note;
    }

    const updated = await workedHoursService.updateWorkedHours(id, updateData);
    if (!updated) {
      sendValidationError(res, 'Record non trovato');
      return;
    }

    sendSuccess(res, updated);
  } catch (error) {
    console.error('Errore durante l\'aggiornamento delle ore lavorate:', error);
    sendError(res, 'Impossibile aggiornare il record');
  }
}

export async function deleteWorkedHours(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      sendValidationError(res, 'ID non valido');
      return;
    }

    await workedHoursService.deleteWorkedHours(id);
    sendSuccess(res, { deleted: true });
  } catch (error) {
    console.error('Errore durante l\'eliminazione delle ore lavorate:', error);
    sendError(res, 'Impossibile eliminare il record');
  }
}

export async function getWorkedHoursSummary(req: Request, res: Response): Promise<void> {
  try {
    const now = new Date();
    const year = req.query.year ? parseInt(req.query.year as string) : now.getFullYear();
    const month = req.query.month ? parseInt(req.query.month as string) : (now.getMonth() + 1);

    if (isNaN(year) || isNaN(month)) {
      sendValidationError(res, 'Anno o mese non validi');
      return;
    }

    const summary = await workedHoursService.getWorkedHoursSummary(year, month);
    sendSuccess(res, summary);
  } catch (error) {
    console.error('Errore durante il calcolo del riepilogo ore lavorate:', error);
    sendError(res, 'Impossibile recuperare il riepilogo');
  }
}

export async function getMonthlyWorkedHoursReport(req: Request, res: Response): Promise<void> {
  try {
    const now = new Date();
    const year = req.query.year ? parseInt(req.query.year as string) : now.getFullYear();
    const month = req.query.month ? parseInt(req.query.month as string) : now.getMonth() + 1;
    const clientId = req.query.clientId ? parseInt(req.query.clientId as string) : NaN;

    if (isNaN(year) || isNaN(month)) {
      sendValidationError(res, 'Anno o mese non validi');
      return;
    }

    if (isNaN(clientId)) {
      sendValidationError(res, 'Cliente obbligatorio per generare il report');
      return;
    }

    const report = await workedHoursService.getWorkedHoursMonthlyReport(year, month, clientId);
    sendSuccess(res, report);
  } catch (error) {
    console.error('Errore durante la creazione del report ore lavorate:', error);
    sendError(res, 'Impossibile recuperare il report delle ore');
  }
}

export async function downloadMonthlyWorkedHoursReportPdf(req: Request, res: Response): Promise<void> {
  try {
    const now = new Date();
    const year = req.query.year ? parseInt(req.query.year as string) : now.getFullYear();
    const month = req.query.month ? parseInt(req.query.month as string) : now.getMonth() + 1;
    const clientId = req.query.clientId ? parseInt(req.query.clientId as string) : NaN;

    if (isNaN(year) || isNaN(month)) {
      sendValidationError(res, 'Anno o mese non validi');
      return;
    }

    if (isNaN(clientId)) {
      sendValidationError(res, 'Cliente obbligatorio per generare il PDF');
      return;
    }

    const report = await workedHoursService.getWorkedHoursMonthlyReport(year, month, clientId);
    const settings = await settingsService.getAllSettings();
    const currencySymbol = normalizeCurrencySymbol(settings.currency_symbol);
    const currencyCode = settings.currency || 'EUR';

    const safeClientName = report.client.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cliente';
    const filename = `report-ore-${safeClientName}-${String(month).padStart(2, '0')}-${year}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.pipe(res);

    renderWorkedHoursReportPdf(doc, report, currencySymbol, currencyCode);

    doc.end();
  } catch (error) {
    console.error('Errore durante il download del report PDF:', error);
    if (!res.headersSent) {
      sendError(res, 'Impossibile generare il PDF');
    }
  }
}

function renderWorkedHoursReportPdf(
  doc: PdfDocInstance,
  report: WorkedHoursMonthlyReport,
  currencySymbol: string,
  currencyCode: string
) {
  const margin = 50;
  const usableWidth = doc.page.width - margin * 2;
  const dateColWidth = 90;
  const hoursColWidth = 70;
  const amountColWidth = 100;
  const descriptionWidth = usableWidth - dateColWidth - hoursColWidth - amountColWidth;
  const periodLabel = getEnglishPeriodLabel(report);

  const logoPath = getLogoImagePath();
  const groupedEntries = (report.grouped_entries && report.grouped_entries.length)
    ? report.grouped_entries
    : fallbackGroupEntries(report.entries || []);

  drawReportHeader(doc, margin, usableWidth, periodLabel, logoPath);
  doc.moveDown(1.2);

  drawClientSummaryCard(doc, margin, usableWidth, report, periodLabel, currencySymbol, currencyCode);
  doc.moveDown(1);

  doc
    .font('Helvetica-Bold')
    .fontSize(13)
    .fillColor('#111827')
    .text('Time entries', margin);

  doc.moveDown(0.35);
  drawTableHeader(doc, margin, usableWidth, dateColWidth, descriptionWidth, hoursColWidth, amountColWidth);

  if (!groupedEntries.length) {
    doc
      .font('Helvetica')
      .fontSize(11)
      .fillColor('#6b7280')
      .text('No hours logged for this period.');
    doc.moveDown(1);
  } else {
    for (const entry of groupedEntries) {
      if (doc.y > doc.page.height - margin - 80) {
        doc.addPage();
        drawReportHeader(doc, margin, usableWidth, periodLabel, logoPath);
        doc.moveDown(0.8);
        drawTableHeader(doc, margin, usableWidth, dateColWidth, descriptionWidth, hoursColWidth, amountColWidth);
      }

      drawEntryRow(
        doc,
        margin,
        usableWidth,
        dateColWidth,
        descriptionWidth,
        hoursColWidth,
        amountColWidth,
        currencySymbol,
        currencyCode,
        entry
      );
    }
  }

  doc.moveDown(1);
  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor('#111827')
    .text('Summary', margin);

  doc
    .moveDown(0.3)
    .font('Helvetica')
    .fontSize(11)
    .fillColor('#111827')
    .text(`Total hours: ${report.totals.hours.toFixed(2)} h`)
    .text(`Total amount: ${formatCurrency(report.totals.amount, currencySymbol, currencyCode)}`);
}

function drawReportHeader(
  doc: PdfDocInstance,
  margin: number,
  width: number,
  periodLabel: string,
  logoPath?: string | null
) {
  const logoWidth = 150;
  const headerHeight = 70;

  doc.save();
  doc
    .roundedRect(margin, margin, logoWidth, headerHeight, 12)
    .fill('#111827')
    .restore();
  if (logoPath) {
    drawCircularLogo(doc, logoPath, margin, margin, logoWidth, headerHeight);
  } else {
    doc
      .font('Helvetica')
      .fontSize(11)
      .fillColor('#9ca3af')
      .text('Logo placeholder', margin + 20, margin + headerHeight / 2 - 6);
  }
  doc.restore();

  doc
    .font('Helvetica-Bold')
    .fontSize(20)
    .fillColor('#111827')
    .text('Worked Hours Report', margin + logoWidth + 20, margin, {
      width: width - logoWidth - 20
    });

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#6b7280')
    .text(`Generated: ${formatDateForPdf(new Date().toISOString())}`, margin + logoWidth + 20, doc.y + 2, {
      width: width - logoWidth - 20
    });

  doc.moveDown(1);

  doc
    .font('Helvetica')
    .fontSize(11)
    .fillColor('#6b7280')
    .text(periodLabel, margin + logoWidth + 20, doc.y, {
      width: width - logoWidth - 20
    });

  doc.moveDown(0.5);
}

function drawCircularLogo(
  doc: PdfDocInstance,
  logoPath: string,
  containerX: number,
  containerY: number,
  containerWidth: number,
  containerHeight: number
) {
  const padding = 10;
  const diameter = Math.min(containerWidth, containerHeight) - padding * 2;
  const x = containerX + (containerWidth - diameter) / 2;
  const y = containerY + (containerHeight - diameter) / 2;
  const centerX = x + diameter / 2;
  const centerY = y + diameter / 2;

  try {
    doc.save();
    doc.circle(centerX, centerY, diameter / 2).clip();
    doc.image(logoPath, x, y, { width: diameter, height: diameter, align: 'center', valign: 'center' });
    doc.restore();

    doc
      .lineWidth(1)
      .strokeColor('#9ca3af')
      .circle(centerX, centerY, diameter / 2)
      .stroke();
  } catch (error) {
    doc.restore();
    doc
      .font('Helvetica')
      .fontSize(11)
      .fillColor('#9ca3af')
      .text('Logo placeholder', containerX + 20, containerY + containerHeight / 2 - 6);
    console.warn('Unable to render logo in PDF:', error);
  }
}

function drawClientSummaryCard(
  doc: PdfDocInstance,
  margin: number,
  width: number,
  report: WorkedHoursMonthlyReport,
  periodLabel: string,
  currencySymbol: string,
  currencyCode: string
) {
  const padding = 18;
  const cardHeight = 90;
  const startY = doc.y;

  doc
    .save()
    .roundedRect(margin, startY, width, cardHeight, 10)
    .fill('#f5f5f4')
    .restore();

  const contentX = margin + padding;
  const contentWidth = width - padding * 2;

  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor('#0f172a')
    .text('Client summary', contentX, startY + padding, {
      width: contentWidth
    });

  doc
    .font('Helvetica')
    .fontSize(10.5)
    .fillColor('#1f2937')
    .text(`Client: ${report.client.name}`, {
      width: contentWidth
    })
    .text(`Period: ${periodLabel}`)
    .text(`Hourly rate: ${formatCurrency(report.client.hourly_rate, currencySymbol, currencyCode)}`);

  doc.y = startY + cardHeight + 12;
}

function drawTableHeader(
  doc: PdfDocInstance,
  margin: number,
  width: number,
  dateColWidth: number,
  descriptionWidth: number,
  hoursColWidth: number,
  amountColWidth: number
) {
  const startY = doc.y;

  doc
    .save()
    .fillColor('#eef2ff')
    .roundedRect(margin, startY - 6, width, 28, 6)
    .fill()
    .restore();

  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor('#1f2937')
    .text('Date', margin + 6, startY, { width: dateColWidth - 6 })
    .text('Description', margin + dateColWidth + 6, startY, { width: descriptionWidth - 6 })
    .text('Hours', margin + dateColWidth + descriptionWidth + 6, startY, {
      width: hoursColWidth,
      align: 'right'
    })
    .text('Amount', margin + dateColWidth + descriptionWidth + hoursColWidth - 6, startY, {
      width: amountColWidth,
      align: 'right'
    });

  doc.moveDown(0.8);
  doc.font('Helvetica').fontSize(10).fillColor('#111827');
}

function drawEntryRow(
  doc: PdfDocInstance,
  margin: number,
  rowWidth: number,
  dateColWidth: number,
  descriptionWidth: number,
  hoursColWidth: number,
  amountColWidth: number,
  currencySymbol: string,
  currencyCode: string,
  group: WorkedHoursGroupedEntry
) {
  const startY = doc.y;
  const contentY = startY + 4;
  const note = formatGroupNotes(group);
  const formattedDate = formatDateShort(group.worked_date);

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#111827')
    .text(formattedDate, margin + 6, contentY, { width: dateColWidth - 6 });

  const noteHeight = doc.heightOfString(note, {
    width: descriptionWidth - 6
  });

  doc.text(note, margin + dateColWidth + 6, contentY, {
    width: descriptionWidth - 6
  });

  doc.text(group.hours.toFixed(2), margin + dateColWidth + descriptionWidth, contentY, {
    width: hoursColWidth,
    align: 'right'
  });

  doc.text(
    formatCurrency(group.amount, currencySymbol, currencyCode),
    margin + dateColWidth + descriptionWidth + hoursColWidth,
    contentY,
    {
      width: amountColWidth,
      align: 'right'
    }
  );

  const rowBottom = Math.max(doc.y, contentY + noteHeight);

  doc
    .moveTo(margin, rowBottom + 6)
    .lineTo(margin + rowWidth, rowBottom + 6)
    .strokeColor('#e5e7eb')
    .lineWidth(0.5)
    .stroke();

  doc.y = rowBottom + 10;
}

function fallbackGroupEntries(entries: WorkedHoursReportEntry[]): WorkedHoursGroupedEntry[] {
  const map = new Map<string, WorkedHoursGroupedEntry>();
  entries.forEach((entry) => {
    if (!map.has(entry.worked_date)) {
      map.set(entry.worked_date, {
        worked_date: entry.worked_date,
        hours: 0,
        amount: 0,
        notes: [],
        records: []
      });
    }
    const group = map.get(entry.worked_date)!;
    group.hours += entry.hours;
    group.amount += entry.amount;
    if (entry.note && entry.note.trim().length) {
      group.notes.push(entry.note.trim());
    }
    group.records.push(entry);
  });

  return Array.from(map.values())
    .map((group) => ({
      ...group,
      hours: Math.round(group.hours * 100) / 100,
      amount: Math.round(group.amount * 100) / 100
    }))
    .sort((a, b) => (a.worked_date < b.worked_date ? -1 : 1));
}

function formatGroupNotes(group: WorkedHoursGroupedEntry): string {
  if (!group.records.length) {
    return '';
  }

  return group.records
    .map((record) => {
      const note = record.note && record.note.trim().length ? record.note.trim() : '';
      return `• ${record.hours.toFixed(2)}h ${!note.length ? '' : '—'} ${note}`;
    })
    .join('\n');
}

function getLogoImagePath(): string | null {
  const candidates = [
    path.resolve(__dirname, '../assets/ds_logo.png'),
    path.resolve(process.cwd(), 'dist/assets/ds_logo.png'),
    path.resolve(process.cwd(), 'src/assets/ds_logo.png'),
    path.resolve(process.cwd(), 'assets/ds_logo.png')
  ];

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    } catch (error) {
      console.warn('Unable to access potential logo path:', candidate, error);
    }
  }

  return null;
}

function formatCurrency(value: number, symbol: string, currencyCode: string) {
  try {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    const parts = formatter.formatToParts(value).map((part) => {
      if (part.type === 'currency') {
        return `${part.value}\u00A0`;
      }
      return part.value;
    });

    return parts.join('').replace(/\u00A0\s*/g, '\u00A0');
  } catch {
    return `${symbol} ${value.toFixed(2)}`;
  }
}

function getEnglishPeriodLabel(report: WorkedHoursMonthlyReport) {
  const date = new Date(report.period.year, report.period.month - 1, 1);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });
}

function formatDateForPdf(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

function formatDateShort(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });
}

function normalizeCurrencySymbol(input?: string | null): string {
  if (!input) {
    return '€';
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return '€';
  }

  const suspicious = /[^\u0020-\u00FF]/.test(trimmed);
  if (trimmed.includes('â') || trimmed.includes('Â') || trimmed.includes('€') || suspicious) {
    return '€';
  }

  if (trimmed.length > 3) {
    return trimmed[0];
  }

  return trimmed;
}

