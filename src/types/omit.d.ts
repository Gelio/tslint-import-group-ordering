type Omit<T extends object, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
