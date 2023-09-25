export type UserRole = "admin" | "moderator" | "member" | "anonymous";

export interface UserProps {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

export interface AuthenticationContextProps {
  user: UserProps;
  isLoading: boolean;
  handleLoginAs: (user: UserRole) => void;
  handleLogout: () => void;
}


export interface LoginResponse {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  nbf: number;
    exp: number;
    iat: number;
    jti: string;
    nonce: string;
}

export interface  LoginData {

  randomness: string;
  nonce: string;
  ephemeralPublicKey: string;
}