import { IRef, LikeNull } from "../type"

export const getCurrent = <T extends {} = any>(ref: IRef<T> | LikeNull): T | LikeNull => {
  if (!ref) return
  if (typeof ref === "function") return ref()
  return ref.current
}

interface FormatIntProps {
  defaultVal: number
  max?: number
  min?: number
}
export const formatInt = (
  num: number | undefined,
  { defaultVal, max = Number.MAX_SAFE_INTEGER, min = Number.MIN_SAFE_INTEGER }: FormatIntProps
) => {
  if (typeof num === "undefined") num = defaultVal
  if (!Number.isInteger(num)) num = ~~num
  if (num > max || num < min) return defaultVal
  return num
}

export const randomStr = (e = 32) => {
  const t = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz",
    a = t.length
  let str = ""
  for (let i = 0; i < e; i++) str += t.charAt(Math.floor(Math.random() * a))
  return str
}
