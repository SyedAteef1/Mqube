import { parseCodebase } from "./parser.ts";
import { computeMetrics } from "./metrics.ts";
import { writeReports } from "./reporter.ts";
import { ScanResult } from "../models/interfaces.ts";

export function runScanner(): ScanResult {
  console.log("[SDIC Scanner] Beginning MQube Development Intelligence Center scan...");
  
  // 1. AST/Regex parse codebase
  const parsed = parseCodebase();
  
  // 2. Compute Health Index (DHI), scores, and git metadata
  const results = computeMetrics(parsed);
  
  // 3. Output markdown reports & history logs
  writeReports(results);
  
  console.log(`[SDIC Scanner] Scan complete. MQube DHI Score: ${results.releaseScores.dhi}% (Grade ${results.releaseScores.grade}).`);
  
  return results;
}
