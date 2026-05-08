export interface CreateUserDto {
  fullName: string;
  userName: string;
  password: string;
  email: string;
}

export interface LoginDto {
  identifier?: string;
  userName?: string;
  password: string;
}

export interface UpdateUserDto {
  fullName?: string;
  userName?: string;
  email?: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  userName: string;
  email: string;
  role: string;
  avatarUrl?: string;
  mustChangePassword?: boolean;
  emailVerified?: boolean;
}

export interface RegisterUserResult {
  user: {
    id: string;
    fullName: string;
    userName: string;
    email: string;
    accountType: string;
    isActive: boolean;
    isSuperAdmin: boolean;
    mustChangePassword: boolean;
    emailVerified: boolean;
  };
  emailVerificationRequired: boolean;
  emailVerificationExpiresAt: string;
}

export interface CsrfTokenResult {
  csrfToken: string;
  headerName: string;
}
