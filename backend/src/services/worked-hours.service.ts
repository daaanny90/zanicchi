/**
 * Worked Hours Service
 * 
 * Handles business logic for manual time tracking tied to clients.
 */

import { RowDataPacket, ResultSetHeader } from 'mysql2';
import db from '../config/database';
import {
  CreateWorkedHourDTO,
  UpdateWorkedHourDTO,
  WorkedHour,
  WorkedHoursSummaryResponse,
  WorkedHoursMonthlyReport,
  WorkedHoursReportEntry,
  WorkedHoursGroupedEntry
} from '../models/WorkedHours.model';
import { Client } from '../models/Client.model';
import { getLastDayOfSpecificMonth } from '../utils/date.utils';

/**
 * Helper to fetch client and hourly rate.
 */
async function getClientById(clientId: number): Promise<Client | null> {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT id, name, hourly_rate FROM clients WHERE id = ?`,
    [clientId]
  );
  if (!rows.length) return null;
  const clientRow = rows[0] as Client & RowDataPacket;
  return {
    ...clientRow,
    hourly_rate: typeof clientRow.hourly_rate === 'number'
      ? clientRow.hourly_rate
      : parseFloat(clientRow.hourly_rate as unknown as string)
  };
}

/**
 * Log worked hours for a client.
 */
export async function logWorkedHours(data: CreateWorkedHourDTO): Promise<WorkedHour> {
  const client = await getClientById(data.client_id);
  if (!client) {
    throw new Error('Cliente non trovato');
  }

  const amount = Math.round(data.hours * client.hourly_rate * 100) / 100;

  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO worked_hours (client_id, worked_date, hours, amount_cached, note)
     VALUES (?, ?, ?, ?, ?)`,
    [
      data.client_id,
      data.worked_date,
      data.hours,
      amount,
      data.note || null
    ]
  );

  return {
    id: result.insertId,
    client_id: data.client_id,
    client_name: client.name,
    worked_date: data.worked_date,
    hours: data.hours,
    amount_cached: amount,
    note: data.note || null
  };
}

/**
 * Retrieve worked hours (optionally filtered by month or client).
 */
export async function getWorkedHours(month?: string, clientId?: number): Promise<WorkedHour[]> {
  const params: any[] = [];
  const conditions: string[] = [];

  if (month) {
    conditions.push(`DATE_FORMAT(wh.worked_date, '%Y-%m') = ?`);
    params.push(month);
  }

  if (clientId) {
    conditions.push(`wh.client_id = ?`);
    params.push(clientId);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT 
        wh.id,
        wh.client_id,
        c.name as client_name,
        wh.worked_date,
        wh.hours,
        wh.amount_cached,
        wh.note,
        wh.created_at,
        wh.updated_at
     FROM worked_hours wh
     JOIN clients c ON c.id = wh.client_id
     ${whereClause}
     ORDER BY wh.worked_date DESC, wh.created_at DESC`,
    params
  );

  return rows as WorkedHour[];
}

/**
 * Update worked hours and recalculate amount if necessary.
 */
export async function updateWorkedHours(id: number, data: UpdateWorkedHourDTO): Promise<WorkedHour | null> {
  const [existingRows] = await db.query<RowDataPacket[]>(
    `SELECT * FROM worked_hours WHERE id = ?`,
    [id]
  );

  if (!existingRows.length) {
    return null;
  }

  const existing = existingRows[0] as WorkedHour;
  const clientId = data.client_id ?? existing.client_id;
  const client = await getClientById(clientId);

  if (!client) {
    throw new Error('Cliente non trovato');
  }

  const hours = data.hours ?? existing.hours;
  const amount = Math.round(hours * client.hourly_rate * 100) / 100;

  await db.query(
    `UPDATE worked_hours
     SET client_id = ?, worked_date = ?, hours = ?, amount_cached = ?, note = ?
     WHERE id = ?`,
    [
      clientId,
      data.worked_date ?? existing.worked_date,
      hours,
      amount,
      data.note !== undefined ? data.note : existing.note,
      id
    ]
  );

  return {
    id,
    client_id: clientId,
    client_name: client.name,
    worked_date: data.worked_date ?? existing.worked_date,
    hours,
    amount_cached: amount,
    note: data.note !== undefined ? data.note : existing.note
  };
}

/**
 * Delete a worked hours entry.
 */
export async function deleteWorkedHours(id: number): Promise<void> {
  await db.query(`DELETE FROM worked_hours WHERE id = ?`, [id]);
}

/**
 * Get monthly summary per client plus totals.
 */
export async function getWorkedHoursSummary(year: number, month: number): Promise<WorkedHoursSummaryResponse> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = getLastDayOfSpecificMonth(year, month);

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT 
        wh.client_id,
        c.name as client_name,
        COALESCE(SUM(wh.hours), 0) as total_hours,
        COALESCE(SUM(wh.amount_cached), 0) as total_amount
     FROM worked_hours wh
     JOIN clients c ON c.id = wh.client_id
     WHERE wh.worked_date BETWEEN ? AND ?
     GROUP BY wh.client_id, c.name
     ORDER BY c.name ASC`,
    [startDate, endDate]
  );

  const summary = rows.map((row) => ({
    client_id: row.client_id,
    client_name: row.client_name,
    hours: parseFloat(row.total_hours),
    amount: parseFloat(row.total_amount)
  }));

  const totals = summary.reduce(
    (acc, item) => {
      acc.total_hours += item.hours;
      acc.total_amount += item.amount;
      return acc;
    },
    { total_hours: 0, total_amount: 0 }
  );

  return {
    summary,
    overall: {
      total_hours: Math.round(totals.total_hours * 100) / 100,
      total_amount: Math.round(totals.total_amount * 100) / 100
    }
  };
}

/**
 * Detailed monthly report for a specific client.
 */
export async function getWorkedHoursMonthlyReport(
  year: number,
  month: number,
  clientId: number
): Promise<WorkedHoursMonthlyReport> {
  const client = await getClientById(clientId);
  if (!client) {
    throw new Error('Cliente non trovato');
  }

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = getLastDayOfSpecificMonth(year, month);
  const periodLabel = new Date(year, month - 1, 1).toLocaleDateString('it-IT', {
    year: 'numeric',
    month: 'long'
  });

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT 
        wh.id,
        wh.worked_date,
        wh.hours,
        wh.amount_cached,
        wh.note
     FROM worked_hours wh
     WHERE wh.client_id = ?
       AND wh.worked_date BETWEEN ? AND ?
     ORDER BY wh.worked_date ASC, wh.created_at ASC`,
    [clientId, startDate, endDate]
  );

  const entries: WorkedHoursReportEntry[] = rows.map((row) => ({
    id: row.id,
    worked_date: row.worked_date,
    hours: parseFloat(row.hours),
    amount: parseFloat(row.amount_cached),
    note: row.note ?? null
  }));

  const groupedEntries = groupEntriesByDay(entries);

  const totals = entries.reduce(
    (acc, item) => {
      acc.hours += item.hours;
      acc.amount += item.amount;
      return acc;
    },
    { hours: 0, amount: 0 }
  );

  return {
    client: {
      id: client.id,
      name: client.name,
      hourly_rate: client.hourly_rate
    },
    period: {
      year,
      month,
      label: periodLabel,
      start_date: startDate,
      end_date: endDate
    },
    entries,
    grouped_entries: groupedEntries,
    totals: {
      hours: Math.round(totals.hours * 100) / 100,
      amount: Math.round(totals.amount * 100) / 100
    }
  };
}

function groupEntriesByDay(entries: WorkedHoursReportEntry[]): WorkedHoursGroupedEntry[] {
  const groups = new Map<string, WorkedHoursGroupedEntry>();

  entries.forEach((entry) => {
    const key = entry.worked_date;
    if (!groups.has(key)) {
      groups.set(key, {
        worked_date: key,
        hours: 0,
        amount: 0,
        notes: [],
        records: []
      });
    }

    const group = groups.get(key)!;
    group.hours += entry.hours;
    group.amount += entry.amount;
    if (entry.note && entry.note.trim().length) {
      group.notes.push(entry.note.trim());
    }
    group.records.push(entry);
  });

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      hours: Math.round(group.hours * 100) / 100,
      amount: Math.round(group.amount * 100) / 100
    }))
    .sort((a, b) => (a.worked_date < b.worked_date ? -1 : 1));
}

