import { useCallback, useEffect, useRef } from "react"
import { useConfigContext } from "../../component/ConfigProvider/ConfigProvider"
import { IRef } from "../../type"
import { getCurrent } from "../../util"
import useWatchEffect from "../effects/useWatchEffect/useWatchEffect"

export type IPosition = { top: number; left: number }
export type ISize = { width: number; height: number }

export type DialogMoveFunc = (position: IPosition, mousePosition: IPosition) => void
export type DialogResizeFunc = (size: ISize, mousePosition: IPosition) => void

export interface UseDialogProps {
  dialogRef: IRef<HTMLElement>
  moveFieldRef?: IRef<HTMLElement>
  resizeFieldRef?: IRef<HTMLElement>
  minSize?: ISize
  confine?: boolean
  onMove?: DialogMoveFunc
  onMoveStart?: DialogMoveFunc
  onMoveEnd?: DialogMoveFunc
  onResize?: DialogResizeFunc
  onResizeStart?: DialogResizeFunc
  onResizeEnd?: DialogResizeFunc
}

const useDialog = (props: UseDialogProps) => {
  const {
    moveFieldRef,
    dialogRef,
    resizeFieldRef,
    minSize = { width: 200, height: 150 },
    confine = true,
    onMove,
    onMoveStart,
    onMoveEnd,
    onResize,
    onResizeStart,
    onResizeEnd,
  } = props
  const { width: minWidth, height: minHeight } = minSize
  const { getMaxZIndex, addKey, delKey } = useConfigContext()
  // 代表鼠标坐标到 dialog 左上角的 offset
  const { current: offset } = useRef({ x: 0, y: 0 })
  const uniqueKey = useRef(Date.now() + Math.random())

  const stateRef = useRef<{ isMoving: boolean; isResizing: boolean }>({ isMoving: false, isResizing: false })

  const moveFunc = useCallback(
    (e: Event) => {
      const box = getCurrent(dialogRef)
      if (!box) return
      box.style.zIndex = getMaxZIndex?.() ?? "1000"
      const { clientX, clientY } = e as MouseEvent

      offset.x = clientX - box.offsetLeft
      offset.y = clientY - box.offsetTop

      let paramState: Parameters<DialogMoveFunc> = [
        { left: clientX - offset.x, top: clientY - offset.y },
        { left: clientX, top: clientY },
      ]
      onMoveStart?.(...paramState)

      document.onmouseup = () => {
        onMoveEnd?.(...paramState)
        document.onmousemove = null
        document.onmouseup = null
        setTimeout(() => (stateRef.current.isMoving = false))
      }

      document.onmousemove = (e: MouseEvent) => {
        stateRef.current.isMoving = true
        let x: number = e.clientX - offset.x
        let y: number = e.clientY - offset.y

        if (confine) {
          // 不允许超出屏幕
          if (x > window.innerWidth - box.offsetWidth) {
            x = window.innerWidth - box.offsetWidth
          }
          if (y > window.innerHeight - box.offsetHeight) {
            y = window.innerHeight - box.offsetHeight
          }
          if (x < 0) x = 0
          if (y < 0) y = 0
        }

        box.style.left = x + "px"
        box.style.top = y + "px"

        paramState = [
          { left: x, top: y },
          { left: e.clientX, top: e.clientY },
        ]
        onMove?.(...paramState)
      }
    },
    [dialogRef, offset, onMove]
  )

  const resizeFunc = useCallback(
    (e: any) => {
      const { layerX = 0, layerY = 0, clientX, clientY } = e
      const { offsetWidth = 0, offsetHeight = 0 } = e?.target ?? {}
      const offsetX = offsetWidth - layerX || 5
      const offsetY = offsetHeight - layerY || 5

      const box = getCurrent(dialogRef)
      if (!box) return
      box.style.zIndex = getMaxZIndex?.() ?? "1000"

      let paramState: Parameters<DialogResizeFunc> = [
        { width: clientX - box.offsetLeft + offsetX, height: clientY - box.offsetTop + offsetY },
        { left: clientX, top: clientY },
      ]
      onResizeStart?.(...paramState)

      document.onmouseup = () => {
        onResizeEnd?.(...paramState)
        document.onmousemove = null
        document.onmouseup = null
        setTimeout(() => (stateRef.current.isResizing = false))
      }
      document.onmousemove = (e: MouseEvent) => {
        stateRef.current.isResizing = true
        let width = e.clientX - box.offsetLeft + offsetX
        let height = e.clientY - box.offsetTop + offsetY

        if (width < minWidth) width = minWidth
        if (height < minHeight) height = minHeight
        if (width > window.innerWidth) width = window.innerWidth
        if (height > window.innerHeight) height = window.innerHeight

        box.style.width = width + "px"
        box.style.height = height + "px"

        paramState = [
          { width, height },
          { left: e.clientX, top: e.clientY },
        ]
        onResize?.(...paramState)
      }
    },
    [dialogRef, minHeight, minWidth, onResize]
  )

  useWatchEffect((el, prevEl) => {
    el?.addEventListener("mousedown", moveFunc)
    prevEl?.removeEventListener("mousedown", moveFunc)
  }, moveFieldRef)

  useWatchEffect((el, prevEl) => {
    el?.addEventListener("mousedown", resizeFunc)
    prevEl?.removeEventListener("mousedown", resizeFunc)
  }, resizeFieldRef)

  useEffect(() => {
    const dialog = getCurrent(dialogRef)
    if (dialog) dialog.style.zIndex = getMaxZIndex?.() ?? "1000"
  })

  useEffect(() => {
    const key = uniqueKey.current
    addKey?.(key)
    return () => {
      delKey?.(key)
    }
  }, [])

  return stateRef.current
}

export default useDialog
