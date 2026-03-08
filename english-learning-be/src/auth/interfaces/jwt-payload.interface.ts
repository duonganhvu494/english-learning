export interface JwtPayload {
    userId: string;
    email: string;
    jti?: string;
    exp?: number;
    iat?: number;
    isSuperAdmin?: boolean;
}
