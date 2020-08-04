export type ValuesAny<T> = T[keyof T];
type Values<T extends object> = T[keyof T];
export default Values;
