import { renderHook } from "@testing-library/react-hooks"
import useWatchEffect from "../useWatchEffect"

describe("useWatchEffect", () => {
  test("should be defined", () => {
    expect(useWatchEffect).toBeDefined()
  })

  test("依赖改变时才执行", () => {
    const fn = jest.fn((val, prevVal) => {})
    const clearFn = jest.fn((val, prevVal) => {})
    const fnRef = jest.fn((val, prevVal) => {})
    const clearFnRef = jest.fn((val, prevVal) => {})
    let count = 0
    const countRef = { current: 0 }
    const { rerender } = renderHook(() => {
      useWatchEffect(
        (val, prevVal) => {
          fn(val, prevVal)
          return () => {
            clearFn(val, prevVal)
          }
        },
        () => count
      )
      useWatchEffect((val, prevVal) => {
        fnRef(val, prevVal)
        return () => {
          clearFnRef(val, prevVal)
        }
      }, countRef)
    })

    expect(fn).toHaveBeenCalledWith(0, undefined)
    expect(clearFn).not.toHaveBeenCalled()
    expect(fnRef).toHaveBeenCalledWith(0, undefined)
    expect(clearFnRef).not.toHaveBeenCalled()
    rerender()
    expect(fn).toHaveBeenCalledTimes(1)
    expect(clearFn).toHaveBeenCalledTimes(1)
    expect(fnRef).toHaveBeenCalledTimes(1)
    expect(clearFnRef).toHaveBeenCalledTimes(1)
    count++
    rerender()
    expect(fn).toHaveBeenCalledWith(1, 0)
    expect(clearFn).toHaveBeenCalledWith(0, undefined)
    expect(fnRef).toHaveBeenCalledTimes(1)
    expect(clearFnRef).toHaveBeenCalledTimes(1)
    countRef.current = 1
    rerender()
    expect(fnRef).toHaveBeenCalledWith(1, 0)
    expect(clearFnRef).toHaveBeenCalledWith(0, undefined)
  })
})
