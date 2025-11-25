/**
 * Worked Hours Model
 * 
 * Represents manually logged hours tied to a client.
 */

export interface WorkedHour {
  id: number;
  client_id: number;
  client_name?: string;
  worked_date: string; // YYYY-MM-DD
  hours: number;
  amount_cached: number;
  note?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateWorkedHourDTO {
  client_id: number;
  worked_date: string;
  hours: number;
  note?: string;
}

export interface UpdateWorkedHourDTO {
  client_id?: number;
  worked_date?: string;
  hours?: number;
  note?: string | null;
}

export interface WorkedHoursSummary {
  client_id: number;
  client_name: string;
  hours: number;
  amount: number;
}

export interface WorkedHoursSummaryResponse {
  summary: WorkedHoursSummary[];
  overall: {
    total_hours: number;
    total_amount: number;
  };
}

