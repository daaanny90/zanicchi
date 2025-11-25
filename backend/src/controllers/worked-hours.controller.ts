/**
 * Worked Hours Controller
 * 
 * Handles HTTP requests for manual time tracking.
 */

import { Request, Response } from 'express';
import * as workedHoursService from '../services/worked-hours.service';
import { sendError, sendSuccess, sendValidationError } from '../utils/response.utils';

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

