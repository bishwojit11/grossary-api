import { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      session?: {
        user: {
          id: string;
          email: string;
          role: Role;
        };
      };
    }
  }
}

export {};
