export type TMeta = {
  totalDocs?: number;
  limit?: number;
  totalPages?: number;
  page?: number;
  pagingCounter?: number;
  hasPrevPage?: boolean;
  hasNextPage?: boolean;
  prevPage?: number;
  nextPage?: number;
};

export type TData<T> = {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
  meta?: TMeta;
  token?: string;
};
