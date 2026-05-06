import { Role } from '@prisma/client';

export interface ISessionUser {
  id: string;
  email: string;
  role: Role;
}

export interface ISession {
  user: ISessionUser;
}
