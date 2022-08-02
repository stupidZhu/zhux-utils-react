import { debounce } from "lodash"
import React, { Fragment, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react"
import ReactDOM from "react-dom"
import { WithChildren } from "../../type"
import { formatInt, randomStr } from "../../util"

type AddFunc = (com: React.ReactNode, option?: { key?: string; replace?: boolean }) => string
type FormatMap<T> = {
  [Prop in keyof T]: (val: T[Prop]) => T[Prop]
}

interface WrapperRef {
  add?: AddFunc
  remove?: (key: string) => boolean | Promise<boolean>
  clear?: () => boolean | Promise<boolean>
  setConfig?: (config: Partial<WrapperConfig>) => void
  keySetRef?: React.MutableRefObject<Set<string>>
}

export interface WrapperConfig {
  reverse: boolean
  maxCount: number
  removeDelay: number
}

type PortalItem = { com: React.ReactNode; key: string; visible: boolean }
type PortalMap = Map<string, PortalItem>

const formatConfigMap: FormatMap<WrapperConfig> = {
  reverse: value => value,
  maxCount: value => formatInt(value, { defaultVal: 10, min: 1 }),
  removeDelay: value => formatInt(value, { defaultVal: 300, min: 0 }),
}

const WrapperCom: React.FC<{ wrapperRef?: { current: Record<string, any> }; createPortalHelper: CreatePortalHelper }> = ({
  wrapperRef,
  createPortalHelper,
}) => {
  const portalMapRef = useRef<PortalMap>(new Map())
  const keySetRef = useRef<Set<string>>(new Set())
  const configRef = useRef<WrapperConfig>({ reverse: false, maxCount: 10, removeDelay: 300 })
  const [portalList, _setPortalList] = useState<PortalItem[]>([])

  const setPortalList = useCallback(
    debounce((map?: PortalMap) => {
      const renderList = Array.from((map ?? portalMapRef.current).values())
      if (configRef.current.reverse) renderList.reverse()
      _setPortalList(renderList)
    }, 10),
    []
  )

  const cloneElement = useCallback((portal: PortalItem) => {
    const isComponent = (
      com: React.ReactNode
    ): com is React.ReactElement<unknown, string | React.JSXElementConstructor<any>> => {
      if (!React.isValidElement(portal.com)) return false
      // @ts-ignore
      return typeof com.type !== "string"
    }

    return isComponent(portal.com)
      ? React.cloneElement(portal.com!, {
          _key: portal.key,
          _visible: portal.visible,
          _createPortalHelper: createPortalHelper,
        })
      : portal.com
  }, [])

  const _remove = useCallback((key: string) => {
    let flag = false
    flag = portalMapRef.current.delete(key)
    setPortalList()
    return flag
  }, [])

  const remove = useCallback(
    (key: string): boolean | Promise<boolean> => {
      const portal = portalMapRef.current.get(key)
      if (!portal) return false
      keySetRef.current.delete(key)
      if (configRef.current.removeDelay > 0) {
        return new Promise(resolve => {
          portal.visible = false
          portal.com = cloneElement(portal)
          setPortalList()
          setTimeout(() => resolve(_remove(key)), configRef.current.removeDelay)
        })
      } else return _remove(key)
    },
    [_remove, cloneElement, setPortalList]
  )

  const add = useCallback(
    (com: React.ReactNode, option: { key?: string; replace?: boolean } = {}) => {
      const { key = `${randomStr(5)}-${Date.now()}`, replace = false } = option
      const portalMap = portalMapRef.current
      const exist = portalMap.has(key)
      if (!replace) {
        if (exist) return key
        if (keySetRef.current.size >= configRef.current.maxCount) return ""
      }
      keySetRef.current.add(key)
      portalMap.set(key, { com: cloneElement({ com, key, visible: exist }), key, visible: exist })
      setPortalList()
      setTimeout(() => {
        if (exist) return
        const portal = portalMap.get(key)
        if (portal) {
          portal.visible = true
          portal.com = cloneElement(portal)
        }
        setPortalList()
      }, 20)
      if (keySetRef.current.size > configRef.current.maxCount) {
        const key = Array.from(keySetRef.current.values())[0]
        remove(key)
      }
      return key
    },
    [cloneElement, remove, setPortalList]
  )

  const _clear = useCallback(() => {
    portalMapRef.current = new Map()
    _setPortalList([])
    return true
  }, [])

  const clear = useCallback((): boolean | Promise<boolean> => {
    keySetRef.current = new Set()
    if (configRef.current.removeDelay > 0) {
      return new Promise(resolve => {
        Array.from(portalMapRef.current.values()).forEach(portal => {
          portal.visible = false
          portal.com = cloneElement(portal)
        })
        setPortalList()
        setTimeout(() => resolve(_clear()), configRef.current.removeDelay)
      })
    } else return _clear()
  }, [_clear, cloneElement, setPortalList])

  const setConfig = useCallback((config: Partial<WrapperConfig> = {}) => {
    Object.keys(config).forEach(key => {
      if (typeof config[key] !== "undefined") configRef.current[key] = formatConfigMap[key](config[key])
    })
  }, [])

  useImperativeHandle(wrapperRef, () => ({ add, remove, clear, setConfig, keySetRef }))

  return (
    <>
      {portalList.map(item => {
        return <Fragment key={item.key}>{item.com}</Fragment>
      })}
    </>
  )
}

const DefaultPortalRoot: React.FC = () => {
  useEffect(() => {
    console.error("如果 renderType 为 render，则不必要使用 PortalRoot")
  }, [])
  return null
}

type CreatePortalHelperProps =
  | {
      rootKey?: string
      renderType: "portal"
    }
  | {
      rootKey?: string
      renderType: "render"
      Provider?: React.FC<WithChildren>
    }

class CreatePortalHelper {
  private rootKey: string
  private wrapperRef: { current: WrapperRef } = { current: {} }
  private renderType: "portal" | "render" = "render"
  PortalRoot = DefaultPortalRoot

  constructor(props: CreatePortalHelperProps = { renderType: "render" }) {
    this.rootKey = props.rootKey ?? `portal-root-${randomStr(5)}-${Date.now()}`
    this.renderType = props.renderType
    if (props.renderType === "portal") {
      this.PortalRoot = () =>
        ReactDOM.createPortal(
          <WrapperCom key={this.rootKey} wrapperRef={this.wrapperRef} createPortalHelper={this} />,
          this.getRootDom()
        )
    } else {
      const Provider = props.Provider ?? (({ children }) => <>{children}</>)
      ReactDOM.render(
        <Provider>
          <WrapperCom key={this.rootKey} wrapperRef={this.wrapperRef} createPortalHelper={this} />
        </Provider>,
        this.getRootDom()
      )
    }
  }

  private getRootDom = () => {
    let dom = document.querySelector(`#${this.rootKey}`)
    if (!dom) {
      dom = document.createElement("div")
      dom.id = this.rootKey
      document.body.appendChild(dom)
    }
    return dom
  }

  private getInitErrorMsg = () => {
    let msg = "init error！"
    if (this.renderType === "portal") msg += "请检查是否将 PortalRoot 写在了组件中"
    return msg
  }

  add: AddFunc = (...rest) => {
    if (!this.wrapperRef.current?.add) throw new Error(this.getInitErrorMsg())
    return this.wrapperRef.current.add(...rest)
  }

  remove = (key: string) => {
    if (!this.wrapperRef.current?.remove) throw new Error(this.getInitErrorMsg())
    return this.wrapperRef.current.remove(key)
  }

  clear = () => {
    if (!this.wrapperRef.current?.clear) throw new Error(this.getInitErrorMsg())
    return this.wrapperRef.current.clear()
  }

  setConfig = (config: Partial<WrapperConfig> = {}) => {
    if (!this.wrapperRef.current?.setConfig) throw new Error(this.getInitErrorMsg())
    this.wrapperRef.current.setConfig(config)
  }

  getKeys = () => new Set(this.wrapperRef.current?.keySetRef?.current)
}

export default CreatePortalHelper
