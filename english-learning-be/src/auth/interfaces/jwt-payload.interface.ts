export interface JwtPayload {
    userId: string;
    email: string;
    emailVerified?: boolean;
    userName?: string;
    fullName?: string;
    jti?: string;
    exp?: number;
    iat?: number;
    isSuperAdmin?: boolean;
    mustChangePassword?: boolean;
}
