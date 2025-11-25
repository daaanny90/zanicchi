/**
 * Client Controller
 * 
 * CRUD handlers for clients used in worked hours tracking.
 */

import { Request, Response } from 'express';
import * as clientService from '../services/client.service';
import { sendError, sendSuccess, sendValidationError } from '../utils/response.utils';

export async function getClients(_req: Request, res: Response): Promise<void> {
  try {
    const clients = await clientService.getAllClients();
    sendSuccess(res, clients);
  } catch (error) {
    console.error('Errore durante il recupero dei clienti:', error);
    sendError(res, 'Impossibile recuperare i clienti');
  }
}

export async function createClient(req: Request, res: Response): Promise<void> {
  try {
    const { name, hourly_rate, notes } = req.body;

    if (!name || typeof name !== 'string') {
      sendValidationError(res, 'Il nome del cliente è obbligatorio.');
      return;
    }

    const rate = parseFloat(hourly_rate);
    if (isNaN(rate) || rate <= 0) {
      sendValidationError(res, 'La tariffa oraria deve essere un numero maggiore di zero.');
      return;
    }

    const client = await clientService.createClient({
      name: name.trim(),
      hourly_rate: rate,
      notes
    });

    sendSuccess(res, client);
  } catch (error) {
    console.error('Errore durante la creazione del cliente:', error);
    sendError(res, 'Impossibile creare il cliente');
  }
}

export async function updateClient(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      sendValidationError(res, 'ID cliente non valido');
      return;
    }

    const { name, hourly_rate, notes } = req.body;
    const updateData: any = {};

    if (name !== undefined) {
      if (!name || typeof name !== 'string') {
        sendValidationError(res, 'Il nome del cliente è obbligatorio.');
        return;
      }
      updateData.name = name.trim();
    }

    if (hourly_rate !== undefined) {
      const rate = parseFloat(hourly_rate);
      if (isNaN(rate) || rate <= 0) {
        sendValidationError(res, 'La tariffa oraria deve essere un numero maggiore di zero.');
        return;
      }
      updateData.hourly_rate = rate;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const updated = await clientService.updateClient(id, updateData);
    if (!updated) {
      sendValidationError(res, 'Cliente non trovato o nessuna modifica richiesta');
      return;
    }

    sendSuccess(res, updated);
  } catch (error) {
    console.error('Errore durante l\'aggiornamento del cliente:', error);
    sendError(res, 'Impossibile aggiornare il cliente');
  }
}

export async function deleteClient(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      sendValidationError(res, 'ID cliente non valido');
      return;
    }

    const result = await clientService.deleteClient(id);
    sendSuccess(res, { 
      deleted: true,
      deletedHours: result.deletedHours
    });
  } catch (error: any) {
    console.error('Errore durante l\'eliminazione del cliente:', error);
    sendError(res, 'Impossibile eliminare il cliente');
  }
}

