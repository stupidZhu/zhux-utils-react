/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom"
import { act, fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import CreatePortalUtil from "../CreatePortalUtil"

const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (/Warning.*not wrapped in act/.test(args[0])) {
      return
    }
    originalError.call(console, ...args)
  }
})
afterAll(() => {
  console.error = originalError
})

describe("CreatePortalUtil", () => {
  test("should be defined", () => {
    expect(CreatePortalUtil).toBeDefined()
  })

  const createPortalUtil = new CreatePortalUtil({ renderType: "portal", rootKey: "hello-world" })

  const TestCom: React.FC<{
    _key?: string
    _visible?: boolean
    _createPortalUtil?: CreatePortalUtil
  }> = props => {
    const { _key, _visible, _createPortalUtil } = props
    return (
      <div data-testid="test-com">
        <button data-testid="close-btn" onClick={() => _createPortalUtil?.remove(_key ?? "")}>
          x
        </button>
        <span data-testid="visible-value">{String(_visible)}</span>
      </div>
    )
  }

  beforeAll(() => {
    jest.useFakeTimers()
  })

  test("测试 add 方法的各参数（不传 key 的情况，key 一致的情况，key 一致但允许 replace 的情况）；测试 remove 和 clear 方法。", () => {
    render(<createPortalUtil.PortalRoot />)
    const keys: Set<string> = new Set()

    expect(createPortalUtil.getKeys().size).toBe(0)
    act(() => {
      keys.add(createPortalUtil.add(<div data-testid="test1">test1</div>))
    })

    expect(screen.queryByTestId("test1")).not.toBeInTheDocument()
    jest.advanceTimersByTime(20)
    expect(screen.queryByTestId("test1")).toBeInTheDocument()
    expect(createPortalUtil.getKeys()).toEqual(keys)

    act(() => {
      keys.add(createPortalUtil.add(<div data-testid="test2">test2</div>, { key: "uniqueKey" }))
    })
    jest.advanceTimersByTime(20)
    expect(screen.queryByTestId("test2")).toBeInTheDocument()
    expect(keys.has("uniqueKey")).toBeTruthy()

    act(() => {
      keys.add(createPortalUtil.add(<div data-testid="test3">test3</div>, { key: "uniqueKey" }))
    })
    jest.advanceTimersByTime(20)
    expect(screen.queryByTestId("test3")).not.toBeInTheDocument()

    act(() => {
      keys.add(createPortalUtil.add(<div data-testid="test4">test4</div>, { key: "uniqueKey", replace: true }))
    })
    jest.advanceTimersByTime(20)
    expect(screen.queryByTestId("test4")).toBeInTheDocument()
    expect(keys.size).toBe(2)

    act(() => {
      createPortalUtil.remove("uniqueKey")
    })
    jest.advanceTimersByTime(320)
    expect(screen.queryByTestId("test4")).not.toBeInTheDocument()
    expect(createPortalUtil.getKeys().size).toBe(1)

    act(() => {
      createPortalUtil.clear()
    })
    jest.advanceTimersByTime(320)
    expect(screen.queryByTestId("test1")).not.toBeInTheDocument()
    expect(createPortalUtil.getKeys().size).toBe(0)
  })

  test("测试传入组件是否补上了相应的 props", () => {
    render(<createPortalUtil.PortalRoot />)
    act(() => {
      createPortalUtil.add(<TestCom />, { key: "uniqueKey" })
    })

    jest.advanceTimersByTime(20)
    expect(screen.queryByTestId("visible-value")).toHaveTextContent("false")
    jest.advanceTimersByTime(20)
    expect(screen.queryByTestId("visible-value")).toHaveTextContent("true")

    act(() => {
      fireEvent.click(screen.getByTestId("close-btn"))
    })
    expect(screen.queryByTestId("visible-value")).toHaveTextContent("true")
    jest.advanceTimersByTime(20)
    expect(screen.queryByTestId("visible-value")).toHaveTextContent("false")

    jest.advanceTimersByTime(300)
    expect(screen.queryByTestId("test-com")).not.toBeInTheDocument()
  })

  test("测试 debounce 和 config 是否生效", () => {
    render(<createPortalUtil.PortalRoot />)
    act(() => {
      createPortalUtil.add(<div data-testid="test1">test1</div>)
    })
    expect(createPortalUtil.getKeys().size).toBe(1)
    jest.advanceTimersByTime(9)
    expect(screen.queryAllByTestId("test1").length).toBe(0)
    act(() => {
      createPortalUtil.add(<div data-testid="test1">test1</div>)
    })
    jest.advanceTimersByTime(9)
    expect(screen.queryAllByTestId("test1").length).toBe(0)
    expect(createPortalUtil.getKeys().size).toBe(2)
    jest.advanceTimersByTime(10)
    expect(screen.queryAllByTestId("test1").length).toBe(2)

    // config
    act(() => {
      createPortalUtil.setConfig({ maxCount: 2, removeDelay: 100 })
      // replace 默认为 false uniqueKey 并没有添加成功
      createPortalUtil.add(<div data-testid="test1">uniqueKey</div>, { key: "uniqueKey" })
    })
    jest.advanceTimersByTime(320)
    expect(screen.queryByText("uniqueKey")).not.toBeInTheDocument()
    expect(screen.queryAllByTestId("test1").length).toBe(2)

    act(() => {
      createPortalUtil.add(<div data-testid="test1">uniqueKey</div>, { key: "uniqueKey", replace: true })
    })
    jest.advanceTimersByTime(20)
    expect(screen.queryByText("uniqueKey")).toBeInTheDocument()
    expect(screen.queryAllByTestId("test1").length).toBe(3)
    jest.advanceTimersByTime(100)
    expect(screen.queryAllByTestId("test1").length).toBe(2)

    act(() => {
      createPortalUtil.remove("uniqueKey")
    })
    jest.advanceTimersByTime(120)
    expect(screen.queryAllByTestId("test1").length).toBe(1)

    act(() => {
      createPortalUtil.clear()
    })
    jest.advanceTimersByTime(120)
    expect(screen.queryAllByTestId("test1").length).toBe(0)
  })

  // react 18 已弃用 ReactDOM.render
  test("测试 renderType 为 render", () => {
    const createPortalUtil = new CreatePortalUtil({ renderType: "render", rootKey: "uniqueKey-renderRoot" })
    expect(document.querySelector("#uniqueKey-renderRoot")).toBeInTheDocument()

    act(() => {
      createPortalUtil.add(<div data-testid="render-content">renderContent</div>, { key: "uniqueKey" })
    })
    jest.advanceTimersByTime(20)
    expect(screen.queryByTestId("render-content")).toBeInTheDocument()

    act(() => {
      createPortalUtil.remove("uniqueKey")
    })
    jest.advanceTimersByTime(320)
    expect(screen.queryByTestId("render-content")).not.toBeInTheDocument()
  })
})
