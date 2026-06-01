import { apiGet } from "./api";

export type HealthResponse = {
  status: string;
};

export function getHealth() {
  return apiGet<HealthResponse>("/health");
}
