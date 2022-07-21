import { useEffect, useRef } from "react"
import { IRef, LikeNull } from "../../../type"
import { getCurrent } from "../../../util"

const useWatchEffect = <T = any>(
  cb: (val: T | LikeNull, prevVal: T | LikeNull) => void | (() => void),
  dep: IRef<T> | LikeNull
) => {
  const depRef = useRef<T | LikeNull>()

  useEffect(() => {
    const _dep = getCurrent(dep)

    if (_dep === depRef.current) return
    const prev = depRef.current
    depRef.current = _dep
    return cb(_dep, prev)
  })
}

export default useWatchEffect
