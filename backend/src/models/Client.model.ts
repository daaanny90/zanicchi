/**
 * Client Model
 * 
 * Represents customers for whom hours are logged.
 * Each client can have their own hourly rate.
 */

export interface Client {
  id: number;
  name: string;
  hourly_rate: number;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateClientDTO {
  name: string;
  hourly_rate: number;
  notes?: string;
}

export interface UpdateClientDTO {
  name?: string;
  hourly_rate?: number;
  notes?: string | null;
}

