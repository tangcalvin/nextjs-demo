export type Unsubscribe = () => void

export class StateStore<T> {
  private state: T
  private readonly listeners = new Set<(state: T) => void>()

  constructor(initial: T) {
    this.state = initial
  }

  get(): T {
    return this.state
  }

  set(next: T): void {
    this.state = next
    for (const l of this.listeners) l(this.state)
  }

  subscribe(listener: (state: T) => void): Unsubscribe {
    this.listeners.add(listener)
    listener(this.state)
    return () => {
      this.listeners.delete(listener)
    }
  }
}


