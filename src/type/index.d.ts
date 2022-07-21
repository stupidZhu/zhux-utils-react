export type WithChildren = { children?: React.ReactNode | undefined }

export type IRef<T> = (() => T) | React.MutableRefObject<T> | React.RefObject<T>

export type LikeNull = undefined | null

export interface ClassStyle {
  className?: string
  style?: React.CSSProperties
}

export as namespace ZhuxUtilReact
