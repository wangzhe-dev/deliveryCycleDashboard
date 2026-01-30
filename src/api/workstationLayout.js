// Consolidated workstation layout provider: create lines and apply stations in one place
// This keeps view components clean and lets layout be reused elsewhere.
import { createBaseLines } from '@/views/workstationProcessReporting/data/lines.base';
import { applyAllStations } from '@/views/workstationProcessReporting/data/stations.apply';

let _cached = null;

export function getWorkstationLines({ fresh = false } = {}) {
  if (!fresh && Array.isArray(_cached)) return _cached;
  const lines = createBaseLines();
  applyAllStations(lines);
  _cached = lines;
  return lines;
}
