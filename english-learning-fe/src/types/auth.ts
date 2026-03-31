export type LoginRequest = {
  userName: string;
  password: string;
};

export type RegisterRequest = {
  fullName: string;
  userName: string;
  email: string;
  password: string;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export type UpdateProfileRequest = {
  fullName?: string;
  userName?: string;
  email?: string;
};

export type ChangePasswordResponse = {
  user: {
    id: string;
    userName: string;
    fullName: string;
    email: string;
    mustChangePassword: boolean;
  };
};

export type UserProfile = {
  id: string;
  userName: string;
  fullName: string;
  email: string;
  mustChangePassword?: boolean;
};

export type MeResponse = {
  id?: string;
  userName: string;
  fullName: string;
  email: string;
  mustChangePassword?: boolean;
};
