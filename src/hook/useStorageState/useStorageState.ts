import { useCallback, useEffect, useMemo, useState } from "react"
import { StorageHelper } from "zhux-utils"
import { IObj } from "zhux-utils/es/type"
import { useConfigContext } from "../../component/ConfigProvider/ConfigProvider"

const _storageHelper = new StorageHelper("ZU")

const useStorageState = <T extends IObj>(key: string, defaultValue: T, customStorageHelper?: StorageHelper) => {
  const { storageHelper: su } = useConfigContext()
  const storageHelper = useMemo(() => customStorageHelper ?? su ?? _storageHelper, [su, customStorageHelper])
  const [state, setState] = useState<T>({ ...defaultValue, ...storageHelper.getItem(key) })

  // TODO: value 的类型
  const setField = useCallback(
    (fieldKey: keyof T | Partial<T> | ((v: T) => T), value?: any) => {
      const rawData = storageHelper.getItem(key, defaultValue)
      if (typeof fieldKey === "string") setState({ ...rawData, [fieldKey]: value })
      else if (typeof fieldKey === "function") setState(fieldKey)
      else setState({ ...rawData, ...(fieldKey as Partial<T>) })
    },
    [defaultValue, key, storageHelper]
  )

  useEffect(() => {
    storageHelper.setItem(key, state)
  }, [key, state, storageHelper])

  return [state, setField] as const
}

export default useStorageState
