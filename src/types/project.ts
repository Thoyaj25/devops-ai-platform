export type Project = {
  id: string;
  name: string;
  description: string | null;
  status: string;

  ownerId: string;

  createdAt: Date;
  updatedAt: Date;

  owner: {
    id: string;
    name: string | null;
    email: string;
  };
};