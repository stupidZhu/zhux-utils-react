import { useCallback, useState } from "react"
import { IObj } from "zhux-utils/es/type"

const useStoreState = <T extends IObj = IObj>(value: T) => {
  const [state, _setState] = useState(value)

  const setState = useCallback((key: keyof T | Partial<T> | ((v: T) => T), value?: any) => {
    if (typeof key === "string") _setState(v => ({ ...v, [key]: value }))
    else if (typeof key === "function") _setState(key)
    else _setState(v => ({ ...v, ...(key as Partial<T>) }))
  }, [])

  return [state, setState] as const
}

export default useStoreState