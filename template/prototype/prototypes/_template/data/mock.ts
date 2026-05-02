/**
 * Mock data for the slice. Keep types co-located with the data so each page
 * imports both from the same module. Replace the example shape below with
 * whatever the real surface needs (orders, plans, users, charges, etc.).
 */

export type Status = 'active' | 'paused' | 'cancelled';

export interface ExampleRecord {
  id: string;
  label: string;
  status: Status;
  createdAt: string;
}

export const mockRecords: ExampleRecord[] = [
  { id: 'rec_001', label: 'Example item one', status: 'active', createdAt: '2026-04-01' },
  { id: 'rec_002', label: 'Example item two', status: 'paused', createdAt: '2026-04-12' },
  { id: 'rec_003', label: 'Example item three', status: 'cancelled', createdAt: '2026-03-22' },
];

export function statusLabel(status: Status): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'paused':
      return 'Paused';
    case 'cancelled':
      return 'Cancelled';
  }
}
