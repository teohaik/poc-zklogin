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

export interface UserKeyData {
    randomness: string;
    nonce: string;
    ephemeralPublicKey: string;
    ephemeralPrivateKey: string;
    maxEpoch:number;
}


export interface GetSaltRequest {
    jwt: string;
    subject:string;
}

export interface GetSaltResponse {
    subject:string;
    salt:string;
}