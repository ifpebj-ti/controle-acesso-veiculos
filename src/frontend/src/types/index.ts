export type UserRole =
  | 'admin'
  | 'porteiro'
  | 'vigilante'
  | 'transporte';

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}