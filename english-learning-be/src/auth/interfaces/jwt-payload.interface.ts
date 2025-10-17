export interface JwtPayload {
    name: string;
    email: string;
    role: string;
    sub: string;
    iat?: number;
    exp?: number;
}
