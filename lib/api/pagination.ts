export type Paginated<T> = {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export function paginated<T>(data: T[], total: number, page: number, limit: number): Paginated<T> {
  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
