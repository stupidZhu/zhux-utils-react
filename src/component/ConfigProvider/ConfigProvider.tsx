import React, { createContext, useCallback, useContext, useRef } from "react"
import { StorageUtil } from "zhux-utils"
import { WithChildren } from "../../type"

const ConfigContext = createContext<{
  getMaxZIndex?: () => string
  addKey?: (key: React.Key) => void
  delKey?: (key: React.Key) => void
  storageUtil?: StorageUtil
} | null>(null)

interface ConfigProviderProps extends WithChildren {
  initMaxZIndex?: number
  storageUtil?: StorageUtil
}

export const ConfigProvider: React.FC<ConfigProviderProps> = props => {
  const { children, initMaxZIndex = 1000, storageUtil } = props
  const maxZIndex = useRef<number>(initMaxZIndex)
  const dialogCollection = useRef<Set<React.Key>>(new Set([]))

  const getMaxZIndex = useCallback(() => {
    maxZIndex.current += 1
    return String(maxZIndex.current)
  }, [])

  const addKey = useCallback((key: React.Key) => dialogCollection.current.add(key), [])

  const delKey = useCallback(
    (key: React.Key) => {
      dialogCollection.current.delete(key)
      if (dialogCollection.current.size <= 0) maxZIndex.current = initMaxZIndex
    },
    [initMaxZIndex]
  )

  return <ConfigContext.Provider value={{ getMaxZIndex, addKey, delKey, storageUtil }}>{children}</ConfigContext.Provider>
}

export const useConfigContext = () => {
  const context = useContext(ConfigContext)
  if (!context) {
    console.warn("请使用 ConfigProvider 以体验 useDialog 完整功能。")
    return {}
  }
  return context
}
