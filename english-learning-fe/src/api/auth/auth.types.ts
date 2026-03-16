export type LoginRequest = {
  userName: string;
  password: string;
};

export type UserProfile = {
  id: string;
  userName: string;
  fullName: string;
  email: string;
};

export type MeResponse = {
  userName: string;
  fullName: string;
  email: string;
};
