/**
 * Конструктор для создания объектов с данными.
 * @example class User extends Constructor
 */
export class Constructor {
  static new<T extends object>(this: new () => T, data: Required<T>): T {
    const instance = new this();

    Object.assign(instance, data);
    return instance;
  }
}
