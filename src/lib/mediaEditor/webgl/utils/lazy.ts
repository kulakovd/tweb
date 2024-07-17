export function lazy<T>(fn: () => T): () => T {
  let value: T | null = null
  return () => {
    if(value === null) {
      value = fn()
    }
    return value
  }
}
