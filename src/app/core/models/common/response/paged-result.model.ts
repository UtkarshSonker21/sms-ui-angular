export class PagedResult<T> {
  items: T[] = [];
  totalCount = 0;
  pageNumber = 1;
  pageSize = 25;
}
