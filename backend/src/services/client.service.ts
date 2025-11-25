/**
 * Client Service
 * 
 * Handles CRUD operations for clients used when logging worked hours.
 */

import { RowDataPacket, ResultSetHeader } from 'mysql2';
import db from '../config/database';
import { Client, CreateClientDTO, UpdateClientDTO } from '../models/Client.model';

/**
 * Get all clients ordered alphabetically.
 */
export async function getAllClients(): Promise<Client[]> {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT id, name, hourly_rate, notes, created_at, updated_at
     FROM clients
     ORDER BY name ASC`
  );

  return rows as Client[];
}

/**
 * Create a new client.
 */
export async function createClient(data: CreateClientDTO): Promise<Client> {
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO clients (name, hourly_rate, notes)
     VALUES (?, ?, ?)`,
    [data.name, data.hourly_rate, data.notes || null]
  );

  return {
    id: result.insertId,
    ...data,
  };
}

/**
 * Update an existing client.
 */
export async function updateClient(id: number, data: UpdateClientDTO): Promise<Client | null> {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) {
    fields.push('name = ?');
    values.push(data.name);
  }

  if (data.hourly_rate !== undefined) {
    fields.push('hourly_rate = ?');
    values.push(data.hourly_rate);
  }

  if (data.notes !== undefined) {
    fields.push('notes = ?');
    values.push(data.notes);
  }

  if (fields.length === 0) {
    return null;
  }

  values.push(id);

  await db.query(
    `UPDATE clients SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT id, name, hourly_rate, notes FROM clients WHERE id = ?`,
    [id]
  );

  if (!rows.length) {
    return null;
  }

  return rows[0] as Client;
}

/**
 * Delete a client and cascade delete all associated worked hours.
 * Returns the number of worked hours that were also deleted.
 */
export async function deleteClient(id: number): Promise<{ deletedHours: number }> {
  // First, count how many worked hours will be deleted
  const [countRows] = await db.query<RowDataPacket[]>(
    `SELECT COUNT(*) as count FROM worked_hours WHERE client_id = ?`,
    [id]
  );
  
  const deletedHours = Number(countRows[0]?.count ?? 0);

  // Delete worked hours first (due to foreign key constraint)
  await db.query(`DELETE FROM worked_hours WHERE client_id = ?`, [id]);

  // Then delete the client
  await db.query(`DELETE FROM clients WHERE id = ?`, [id]);

  return { deletedHours };
}

