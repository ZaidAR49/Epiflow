/**
 * Functional Result pattern implementation for type-safe error handling.
 * Eliminates unhandled exception bubbles and enforces explicit failure modeling.
 */

export type Ok<T> = {
  readonly success: true;
  readonly data: T;
};

export type Err<E> = {
  readonly success: false;
  readonly error: E;
};

export type Result<T, E> = Ok<T> | Err<E>;

export function ok<T>(data: T): Ok<T> {
  return { success: true, data };
}

export function err<E>(error: E): Err<E> {
  return { success: false, error };
}

export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.success;
}

export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return !result.success;
}
