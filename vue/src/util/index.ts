import { t } from '@/i18n'
import { message } from 'ant-design-vue'
import { reactive } from 'vue'
import { FetchQueue, idKey, typedEventEmitter, type UniqueId } from 'vue3-ts-util'

export const parentWindow = () => {
  return parent.window as any as Window & {
    switch_to_img2img(): void
    switch_to_txt2img(): void
  }
}

/**
 * 勿删
 * @returns
 */
export function gradioApp(): Window & Document {
  try {
    return (parent.window as any).gradioApp()
  } catch (error) {
    //
  }
  const elems = parent.document.getElementsByTagName('gradio-app')
  const gradioShadowRoot = elems.length == 0 ? null : elems[0].shadowRoot
  return (gradioShadowRoot ? gradioShadowRoot : document) as any
}

export const getTabIdxInSDWebui = () => {
  const tabList = gradioApp().querySelectorAll('#tabs > .tabitem[id^=tab_]')
  return Array.from(tabList).findIndex(v => v.id.includes('infinite-image-browsing'))
}

export const switch2IBB = () => {
  try {
    gradioApp().querySelector('#tabs')!.querySelectorAll('button')[getTabIdxInSDWebui()].click()
  } catch (error) {
    console.error(error)
  }
}

export const asyncCheck = async <T>(getter: () => T, checkSize = 100, timeout = 1000) => {
  return new Promise<T>((x) => {
    const check = (num = 0) => {
      const target = getter()
      if (target !== undefined && target !== null) {
        x(target)
      } else if (num > timeout / checkSize) {
        // 超时
        x(target)
      } else {
        setTimeout(() => check(++num), checkSize)
      }
    }
    check()
  })
}

export const key = (obj: UniqueId) => obj[idKey]
export type Dict<T = any> = Record<string, T>
/**
 * 推导比loadsh好
 * @param v
 * @param keys
 */
export const pick = <T extends Dict, keys extends Array<keyof T>>(v: T, ...keys: keys) => {
  return keys.reduce((p, c) => {
    p[c] = v?.[c]
    return p
  }, {} as Pick<T, keys[number]>)
}
/**
 * 获取一个异步函数的返回类型，
 *
 * ReturnTypeAsync\<typeof fn\>
 */
export type ReturnTypeAsync<T extends (...arg: any) => Promise<any>> = Awaited<ReturnType<T>>

export function isImageFile(filename: string): boolean {
  if (typeof filename !== 'string') {
    return false
  }
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
  const extension = filename.split('.').pop()?.toLowerCase()
  return extension !== undefined && imageExtensions.includes(`.${extension}`)
}

export const createReactiveQueue = () => reactive(new FetchQueue(-1, 0, -1, 'throw'))

export const copy2clipboardI18n = async (text: string, msg?: string) => {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text)
    } else {
      const input = document.createElement('input')
      input.value = text
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }
    message.success(msg ?? t('copied'))
  } catch (error) {
    message.error("copy failed. maybe it's non-secure environment")
  }
}

export const { useEventListen: useGlobalEventListen, eventEmitter: globalEvents } =
  typedEventEmitter<{
    'return-to-iib'(): void
    updateGlobalSetting(): void
  }>()

type AsyncFunction<T> = (...args: any[]) => Promise<T>

export function makeAsyncFunctionSingle<T>(fn: AsyncFunction<T>): AsyncFunction<T> {
  let promise: Promise<T> | null = null
  let isExecuting = false

  return async function (this: any, ...args: any[]): Promise<T> {
    if (isExecuting) {
      // 如果当前有其他调用正在执行，直接返回上一个 Promise 对象
      return promise as Promise<T>
    }

    isExecuting = true

    try {
      // 执行异步函数并等待结果
      promise = fn.apply(this, args)
      const result = await promise
      return result
    } finally {
      isExecuting = false
    }
  }
}

export function removeQueryParams(keys: string[]): string {
  // 获取当前 URL
  const url: string = parent.location.href

  // 解析 URL，获取查询参数部分
  const searchParams: URLSearchParams = new URLSearchParams(parent.location.search)

  // 删除指定的键
  keys.forEach((key: string) => {
    searchParams.delete(key)
  })

  // 构建新的 URL
  const newUrl: string = `${url.split('?')[0]}${
    searchParams.size ? '?' : ''
  }${searchParams.toString()}`

  // 使用 pushState() 方法将新 URL 添加到浏览器历史记录中
  parent.history.pushState(null, '', newUrl)

  // 返回新的 URL
  return newUrl
}


export const createImage = (src: string) => {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = err => reject(err)
    img.src = src
  })
}