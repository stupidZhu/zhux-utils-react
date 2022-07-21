export type WithChildren = { children?: React.ReactNode | undefined }

export type IRef<T> = (() => T) | React.MutableRefObject<T> | React.RefObject<T>

export type LikeNull = undefined | null

export as namespace ZhuxUtilReact
