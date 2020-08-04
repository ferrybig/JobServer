import Values from './Values';

export type KeysWhereValueExtendsAny<B, T> = Values<{ [K in keyof B]: B[K] extends T ? K : never}>;
type KeysWhereValueExtends<B extends object, T> = Values<{ [K in keyof B]: B[K] extends T ? K : never}>;
export default KeysWhereValueExtends;
