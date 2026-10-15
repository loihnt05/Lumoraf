import { apiRequest } from "./client";

export type HealthResponse = {
  status: "UP" | "DOWN";
  service: "lumorab";
  database: "UP" | "DOWN";
  timestamp: string;
};

export function getHealth(signal?: AbortSignal) {
  return apiRequest<HealthResponse>("/api/health", { signal });
}
