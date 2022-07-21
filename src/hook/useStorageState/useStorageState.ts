import { useCallback, useEffect, useMemo, useState } from "react"
import { StorageUtil } from "zhux-utils"
import { IObj } from "zhux-utils/es/type"
import { useConfigContext } from "../../component/ConfigProvider/ConfigProvider"

const _storageUtil = new StorageUtil("ZU")

const useStorageState = <T extends IObj>(key: string, defaultValue: T, customStorageUtil?: StorageUtil) => {
  const { storageUtil: su } = useConfigContext()
  const storageUtil = useMemo(() => customStorageUtil ?? su ?? _storageUtil, [su, customStorageUtil])
  const [state, setState] = useState<T>({ ...defaultValue, ...storageUtil.getItem(key) })

  // TODO: value 的类型
  const setField = useCallback(
    (fieldKey: keyof T | Partial<T> | ((v: T) => T), value?: any) => {
      const rawData = storageUtil.getItem(key, defaultValue)
      if (typeof fieldKey === "string") setState({ ...rawData, [fieldKey]: value })
      else if (typeof fieldKey === "function") setState(fieldKey)
      else setState({ ...rawData, ...(fieldKey as Partial<T>) })
    },
    [defaultValue, key, storageUtil]
  )

  useEffect(() => {
    storageUtil.setItem(key, state)
  }, [key, state, storageUtil])

  return [state, setField] as const
}

export default useStorageState
