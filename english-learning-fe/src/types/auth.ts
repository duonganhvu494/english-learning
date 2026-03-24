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

export type UserProfile = {
  id: string;
  userName: string;
  fullName: string;
  email: string;
};

export type MeResponse = {
  id?: string;
  userName: string;
  fullName: string;
  email: string;
  mustChangePassword?: boolean;
};
