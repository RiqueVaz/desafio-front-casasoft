export interface Claim {
  value: string;
  type: string;
}

export interface UserToken {
  email: string;
  firstName: string;
  login: string;
  nomeEmpresa: string;
  claims: Claim[];
}

export interface AuthResponse {
  data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    userToken: UserToken;
  }
}
