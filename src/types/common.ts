/**
 * 通用工具类型
 */

// 空对象类型
export type EmptyObject = Record<string, never>;

// 可空类型
export type Nullable<T> = T | null | undefined;

// 非空类型
export type NonNullable<T> = T extends null | undefined ? never : T;

// 深度部分类型
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// 深度只读类型
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// 键值映射类型
export type ValueOf<T> = T[keyof T];

// 键类型提取
export type KeyOf<T> = keyof T;

// 可选键
export type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

// 必需键
export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

// 函数类型
export type AnyFunction = (...args: any[]) => any;

// 异步函数类型
export type AnyAsyncFunction = (...args: any[]) => Promise<any>;

// 构造函数类型
export type Constructor<T = {}> = new (...args: any[]) => T;

// 抽象构造函数类型
export type AbstractConstructor<T = {}> = abstract new (
  ...args: any[]
) => T;

// Promise 类型
export type PromiseType<T> = T extends Promise<infer U> ? U : T;

// 数组元素类型
export type ArrayElement<T> = T extends (infer U)[] ? U : never;

// 元组转联合类型
export type TupleToUnion<T extends readonly unknown[]> = T[number];

// 对象路径类型
export type Path<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? K | `${K}.${Path<T[K]>}`
          : K
        : never;
    }[keyof T]
  : never;

// 根据路径获取类型
export type PathValue<
  T,
  P extends Path<T>
> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? Rest extends Path<T[K]>
      ? PathValue<T[K], Rest>
      : never
    : never
  : P extends keyof T
    ? T[P]
    : never;

// 品牌化类型（防止类型混淆）
export type Brand<T, B> = T & { __brand: B };

// 事件处理器类型
export type EventHandler<E extends Event = Event> = (event: E) => void;

// 变化处理器类型
export type ChangeHandler<T> = (value: T) => void;

// ID 类型
export type ID = Brand<string, 'ID'>;

// 时间戳类型
export type Timestamp = Brand<number, 'Timestamp'>;

// UUID 类型
export type UUID = Brand<string, 'UUID'>;

// 帮助函数：生成 ID
export const generateId = (): ID => {
  return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` as ID;
};

// 帮助函数：生成 UUID（简化版）
export const generateUUID = (): UUID => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  }) as UUID;
};

// 帮助函数：获取当前时间戳
export const now = (): Timestamp => {
  return Date.now() as Timestamp;
};
