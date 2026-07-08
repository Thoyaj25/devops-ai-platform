export interface DeploymentProvider {
  checkout(): Promise<void>;
  build(): Promise<void>;
  push(): Promise<void>;
  deploy(): Promise<void>;
}