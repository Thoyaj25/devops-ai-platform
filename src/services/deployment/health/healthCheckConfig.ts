export interface HealthCheckConfig {
  path: string;
  port: number;
  startupTimeout: number;
}