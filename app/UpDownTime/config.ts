// Threshold: if no rows for >= 20 min → DOWN
export const THRESHOLD_SECONDS = 20 * 60; // 1200
export const POLL_MS = 2000;              // how often the client polls the API
export const SAMPLE_SCAN_LIMIT = 600;     // rows to scan to find last downtime boundary
