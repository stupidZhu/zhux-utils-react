import { useEffect, useRef } from "react"
import { IObj } from "zhux-utils/es/type"

const useWhyDidYouRender = (key: React.Key, props: IObj) => {
  const prevProps = useRef(props)

  useEffect(() => {
    // TODO:
    // if (process.env.NODE_ENV === "production") {
    //   console.error("check useWhyDidYouRender")
    //   return
    // }
    const changedProps: IObj = {}
    Object.entries(props).forEach(([k, v]) => {
      const prev = prevProps.current[k]
      if (v !== prev) changedProps[k] = { current: v, prev }
    })
    Object.keys(changedProps).length && console.log(key, "---", changedProps)
    prevProps.current = props
  })
}

export default useWhyDidYouRender
