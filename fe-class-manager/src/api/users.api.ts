import type {
  CreateUserDto,
  RegisterUserResult,
  UpdateUserDto,
  UserProfile,
} from '@/types';
import { authApi } from './auth.api';
import { http, unwrap } from './http';

export const usersApi = {
  async register(payload: CreateUserDto): Promise<RegisterUserResult> {
    await authApi.ensureCsrfToken();
    return unwrap<RegisterUserResult>(http.post('/users/register', payload));
  },

  async getMe(): Promise<UserProfile> {
    return unwrap<UserProfile>(http.get('/users/me'));
  },

  async updateMe(payload: UpdateUserDto): Promise<UserProfile> {
    await authApi.ensureCsrfToken();
    return unwrap<UserProfile>(http.patch('/users/me', payload));
  },
};
