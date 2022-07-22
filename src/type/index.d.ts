export type WithChildren = { children?: React.ReactNode | undefined }

export type IRef<T> = (() => T) | React.MutableRefObject<T> | React.RefObject<T>

export type LikeNull = undefined | null

export interface ClassStyle {
  className?: string
  style?: React.CSSProperties
}

export interface CommonComProps<T = any> extends ClassStyle {
  value?: T
  defaultValue?: T
  onChange?: (value: T) => void
}

export as namespace ZhuxUtilReact
