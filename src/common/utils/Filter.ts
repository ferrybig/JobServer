type Filter<B, T> = B extends T ? B : never;
export default Filter;
