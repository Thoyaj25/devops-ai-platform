export type Deployment = {
  id: string;
  version: string | null;
  status: string;
  logs: string | null;
  createdAt: string;

  project: {
    id: string;
    name: string;
  };

  environment: {
    id: string;
    name: string;
    type: string;
  };

  pipeline: {
    id: string;
    name: string;
    provider: string | null;
    repository: string | null;
  };
};