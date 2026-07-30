export type UserRole = 'ADMIN' | 'MANAGER' | 'OPERATOR';

export interface AuthenticatedUser {
  sub: string;
  email: string;
  role: UserRole;
}
