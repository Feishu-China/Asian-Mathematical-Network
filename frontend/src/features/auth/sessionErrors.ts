import axios from 'axios';

type CodedError = {
  code?: string;
};

export const isUnauthorizedSessionError = (error: unknown) =>
  (typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as CodedError).code === 'UNAUTHORIZED') ||
  (axios.isAxiosError(error) && error.response?.status === 401);
