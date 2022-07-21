import { DependencyList, EffectCallback, useEffect, useRef } from "react"

const useOnceEffect = (cb: EffectCallback, dep?: DependencyList, condition?: () => boolean) => {
  const ref = useRef(true)
  useEffect(() => {
    const c = typeof condition === "function" ? condition() && ref.current : ref.current
    if (c) {
      ref.current = false
      return cb()
    }
  }, dep)
}

export default useOnceEffect
