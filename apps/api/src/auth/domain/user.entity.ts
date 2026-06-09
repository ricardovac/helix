export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
}

export interface UserWithSecret extends AuthUser {
  passwordHash: string;
}

export interface NewUser {
  email: string;
  displayName: string;
  passwordHash: string;
}

export interface AuthResult {
  accessToken: string;
  user: AuthUser;
}

export interface JwtPayload {
  sub: string;
  email: string;
}
