export { initDatabase, getDatabase, closeDatabase } from './db';
export { SCHEMA_VERSION, CREATE_TABLES_SQL } from './schema';
export type {
  Log,
  Target,
  TargetHistoryEntry,
  Period,
  Setting,
  SwipeDirectionType,
  TargetStatus,
} from './types';
