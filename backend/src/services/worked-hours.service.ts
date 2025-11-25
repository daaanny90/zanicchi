/**
 * Worked Hours Service
 * 
 * Handles business logic for manual time tracking tied to clients.
 */

import { RowDataPacket, ResultSetHeader } from 'mysql2';
import db from '../config/database';
import { CreateWorkedHourDTO, UpdateWorkedHourDTO, WorkedHour, WorkedHoursSummaryResponse } from '../models/WorkedHours.model';
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
  return rows[0] as Client;
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

