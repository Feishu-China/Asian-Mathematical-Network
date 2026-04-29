import type { Profile, UserRole, UserStatus, WorkspaceKey } from '@asiamath/shared/models';
import { api } from './client';

export type ConferenceStaffMembership = {
  conference_id: string;
  staff_role: string;
};

export type AuthUser = {
  id: string;
  email: string;
  status: UserStatus;
  role: UserRole | null;
  roles: UserRole[];
  available_workspaces: WorkspaceKey[];
  primary_role: UserRole | null;
  conference_staff_memberships?: ConferenceStaffMembership[];
  createdAt: string;
  updatedAt: string;
};

export type AuthSuccessResponse = {
  accessToken: string;
  user: AuthUser;
};

export type MeResponse = {
  user: AuthUser;
  profile: Profile;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = LoginInput & {
  fullName: string;
};

export const login = async (data: LoginInput): Promise<AuthSuccessResponse> => {
  const response = await api.post('/auth/login', data);
  return response.data;
};

export const register = async (data: RegisterInput): Promise<AuthSuccessResponse> => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

export const getMe = async (token: string): Promise<MeResponse> => {
  const response = await api.get('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
