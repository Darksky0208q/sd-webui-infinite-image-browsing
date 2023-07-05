import { useGlobalStore, type FileTransferTabPane, type Shortcut } from '@/store/useGlobalStore'
import { useImgSliStore } from '@/store/useImgSli'
import { onLongPress, useElementSize } from '@vueuse/core'
import { ref, computed, watch, onMounted, h, type Ref } from 'vue'
import { gradioApp, parentWindow } from '@/util'
import { genInfoCompleted, getImageGenerationInfo, openFolder, setImgPath } from '@/api'
import {
  useWatchDocument,
  ok,
  createTypedShareStateHook,
  delay,
  typedEventEmitter
} from 'vue3-ts-util'
import {
  createReactiveQueue,
  isImageFile,
  copy2clipboardI18n,
  useGlobalEventListen,
  makeAsyncFunctionSingle,
  globalEvents
} from '@/util'
import { getTargetFolderFiles, type FileNodeInfo, deleteFiles, moveFiles } from '@/api/files'
import { sortFiles, sortMethodConv } from './fileSort'
import { cloneDeep, debounce, last, range, uniqBy, uniqueId } from 'lodash-es'
import * as Path from '@/util/path'
import type Progress from 'nprogress'
// @ts-ignore
import NProgress from 'multi-nprogress'
import { Modal, message, notification } from 'ant-design-vue'
import type { MenuInfo } from 'ant-design-vue/lib/menu/src/interface'
import { t } from '@/i18n'
import { DatabaseOutlined } from '@/icon'
import { addScannedPath, removeScannedPath, toggleCustomTagToImg } from '@/api/db'
import { FileTransferData, isFileTransferData, toRawFileUrl } from './util'
export * from './util'

export const stackCache = new Map<string, Page[]>()

const global = useGlobalStore()
const sli = useImgSliStore()
const imgTransferBus = new BroadcastChannel('iib-image-transfer-bus')
export const { eventEmitter: events, useEventListen } = typedEventEmitter<{
  removeFiles(_: { paths: string[]; loc: string }): void
  addFiles(_: { files: FileNodeInfo[]; loc: string }): void
}>()

export interface Scroller {
  $_startIndex: number
  $_endIndex: number
  scrollToItem(idx: number): void
}

export const { useHookShareState } = createTypedShareStateHook(
  (_inst, { images }) => {
    const props = ref<Props>({ tabIdx: -1, paneIdx: -1 })
    const currPage = computed(() => last(stack.value))
    const stack = ref<Page[]>([])
    const basePath = computed(() =>
      stack.value.map((v) => v.curr).slice(global.conf?.is_win ? 1 : 0)
    )
    const currLocation = computed(() => Path.join(...basePath.value))
    const sortMethod = ref(global.defaultSortingMethod)
    const sortedFiles = computed(() => {
      if (images.value) {
        return images.value
      }
      if (!currPage.value) {
        return []
      }
      const files = currPage.value?.files ?? []
      const method = sortMethod.value
      const { walkFiles } = currPage.value!
      const filter = (files: FileNodeInfo[]) =>
        global.onlyFoldersAndImages
          ? files.filter((file) => file.type === 'dir' || isImageFile(file.name))
          : files
      if (props.value.walkModePath) {
        /**
         * @see Page
         */
        return walkFiles
          ? walkFiles.map((dir) => sortFiles(filter(dir), method)).flat()
          : sortFiles(filter(files), method)
      }
      return sortFiles(filter(files), method)
    })
    const multiSelectedIdxs = ref([] as number[])
    const previewIdx = ref(-1)

    const canLoadNext = ref(true)

    const spinning = ref(false)

    const previewing = ref(false)

    const getPane = () => {
      return global.tabList[props.value.tabIdx].panes[props.value.paneIdx] as FileTransferTabPane
    }
    return {
      previewing,
      spinning,
      canLoadNext,
      multiSelectedIdxs,
      previewIdx,
      basePath,
      currLocation,
      currPage,
      stack,
      sortMethod,
      sortedFiles,
      scroller: ref<Scroller>(),
      stackViewEl: ref<HTMLDivElement>(),
      props,
      getPane,
      ...typedEventEmitter<{
        loadNextDir(isFullscreenPreview?: boolean): Promise<void>
        refresh(): Promise<void>
      }>()
    }
  },
  () => ({ images: ref<FileNodeInfo[]>() })
)

export interface Props {
  tabIdx: number
  paneIdx: number
  path?: string
  walkModePath?: string
}

export type ViewMode = 'detailList' | 'previewGrid' | 'largePreviewGrid'
export const viewModes: ViewMode[] = ['detailList', 'largePreviewGrid', 'previewGrid']

export interface Page {
  files: FileNodeInfo[]
  walkFiles?: FileNodeInfo[][] // 使用walk时，各个文件夹之间分散排序，避免创建时间不同的带来的干扰
  curr: string
}
/**
 * 全屏预览
 * @param props
 * @returns
 */
export function usePreview(
  props: Props,
  custom?: { files: Ref<FileNodeInfo[] | undefined>; scroller: Ref<Scroller | undefined> }
) {
  const { previewIdx, eventEmitter, canLoadNext, previewing } = useHookShareState().toRefs()
  const { state } = useHookShareState()
  const files = computed(() => custom?.files.value ?? state.sortedFiles)
  const scroller = computed(() => custom?.scroller.value ?? state.scroller)
  let waitScrollTo = null as number | null
  const onPreviewVisibleChange = (v: boolean, lv: boolean) => {
    previewing.value = v
    if (waitScrollTo != null && !v && lv) {
      // 关闭预览时滚动过去
      scroller.value?.scrollToItem(waitScrollTo)
      waitScrollTo = null
    }
  }

  const loadNextIfNeeded = () => {
    if (props.walkModePath) {
      if (!canPreview('next') && canLoadNext) {
        message.info(t('loadingNextFolder'))
        eventEmitter.value.emit('loadNextDir', true) // 如果在全屏预览时外面scroller可能还停留在很久之前，使用全屏预览的索引
      }
    }
  }

  useWatchDocument('keydown', (e) => {
    if (previewing.value) {
      let next = previewIdx.value
      if (['ArrowDown', 'ArrowRight'].includes(e.key)) {
        next++
        while (files.value[next] && !isImageFile(files.value[next].name)) {
          next++
        }
      } else if (['ArrowUp', 'ArrowLeft'].includes(e.key)) {
        next--
        while (files.value[next] && !isImageFile(files.value[next].name)) {
          next--
        }
      }
      if (isImageFile(files.value[next]?.name) ?? '') {
        previewIdx.value = next
        const s = scroller.value
        if (s && !(next >= s.$_startIndex && next <= s.$_endIndex)) {
          waitScrollTo = next // 关闭预览时滚动过去
        }
      }
      loadNextIfNeeded()
    }
  })
  const previewImgMove = (type: 'next' | 'prev') => {
    let next = previewIdx.value
    if (type === 'next') {
      next++
      while (files.value[next] && !isImageFile(files.value[next].name)) {
        next++
      }
    } else if (type === 'prev') {
      next--
      while (files.value[next] && !isImageFile(files.value[next].name)) {
        next--
      }
    }
    if (isImageFile(files.value[next]?.name) ?? '') {
      previewIdx.value = next
      const s = scroller.value
      if (s && !(next >= s.$_startIndex && next <= s.$_endIndex)) {
        waitScrollTo = next // 关闭预览时滚动过去
      }
    }
    loadNextIfNeeded()
  }
  const canPreview = (type: 'next' | 'prev') => {
    let next = previewIdx.value
    if (type === 'next') {
      next++
      while (files.value[next] && !isImageFile(files.value[next].name)) {
        next++
      }
    } else if (type === 'prev') {
      next--
      while (files.value[next] && !isImageFile(files.value[next].name)) {
        next--
      }
    }
    return isImageFile(files.value[next]?.name) ?? ''
  }

  useEventListen('removeFiles', async () => {
    if (previewing.value && !state.sortedFiles[previewIdx.value]) {
      message.info(t('manualExitFullScreen'), 5)
      await delay(500)
      ;(
        document.querySelector(
          '.ant-image-preview-operations-operation .anticon-close'
        ) as HTMLDivElement
      )?.click()
      previewIdx.value = -1
    }
  })

  return {
    previewIdx,
    onPreviewVisibleChange,
    previewing,
    previewImgMove,
    canPreview
  }
}

export function useLocation(props: Props) {
  const np = ref<Progress.NProgress>()
  const {
    scroller,
    stackViewEl,
    stack,
    currPage,
    currLocation,
    sortMethod,
    useEventListen,
    eventEmitter,
    getPane
  } = useHookShareState().toRefs()

  watch(
    () => stack.value.length,
    debounce((v, lv) => {
      if (v !== lv) {
        scroller.value?.scrollToItem(0)
      }
    }, 300)
  )

  const handleWalkModeTo = async (path: string) => {
    await to(path)
    if (props.walkModePath) {
      await delay()
      const [firstDir] = sortFiles(currPage.value!.files, sortMethod.value).filter(
        (v) => v.type === 'dir'
      )
      if (firstDir) {
        await to(firstDir.fullpath)
      }
      await eventEmitter.value.emit('loadNextDir')
    }
  }

  onMounted(async () => {
    if (!stack.value.length) {
      // 有传入stack时直接使用传入的
      const resp = await getTargetFolderFiles('/')
      stack.value.push({
        files: resp.files,
        curr: '/'
      })
    }
    np.value = new NProgress()
    np.value!.configure({ parent: stackViewEl.value as any })
    if (props.path && props.path !== '/') {
      await handleWalkModeTo(props.walkModePath ?? props.path)
    } else {
      global.conf?.home && to(global.conf.home)
    }
  })

  watch(
    currLocation,
    debounce((loc) => {
      const pane = getPane.value()
      pane.path = loc
      const filename = pane.path!.split('/').pop()
      const getTitle = () => {
        if (!props.walkModePath) {
          const np = Path.normalize(loc)
          for (const [k, v] of Object.entries(global.pathAliasMap)) {
            if (np.startsWith(v)) {
              return np.replace(v, k)
            }
          }
          return filename
        }
        return (
          'Walk: ' +
          (global.quickMovePaths.find((v) => v.dir === pane.walkModePath)?.zh ?? filename)
        )
      }
      const title = getTitle()
      pane.name = h('div', { style: 'display:flex;align-items:center' }, [
        h(DatabaseOutlined),
        h('span', { class: 'line-clamp-1', style: 'max-width: 256px' }, title)
      ])
      pane.nameFallbackStr = title
      global.recent = global.recent.filter((v) => v.key !== pane.key)
      global.recent.unshift({ path: loc, key: pane.key })
      if (global.recent.length > 20) {
        global.recent = global.recent.slice(0, 20)
      }
    }, 300)
  )

  const copyLocation = () => copy2clipboardI18n(currLocation.value)

  const openNext = async (file: FileNodeInfo) => {
    if (file.type !== 'dir') {
      return
    }
    try {
      np.value?.start()
      const { files } = await getTargetFolderFiles(file.fullpath)
      stack.value.push({
        files,
        curr: file.name
      })
    } finally {
      np.value?.done()
    }
  }

  const back = (idx: number) => {
    while (idx < stack.value.length - 1) {
      stack.value.pop()
    }
  }

  const isDirNameEqual = (a: string, b: string) => {
    ok(global.conf, 'global.conf load failed')
    if (global.conf.is_win) {
      // window下忽略
      return a.toLowerCase() == b.toLowerCase()
    }
    return a == b
  }

  const to = async (dir: string) => {
    const backup = stack.value.slice()
    try {
      if (!Path.isAbsolute(dir)) {
        // 相对路径
        dir = Path.join(global.conf?.sd_cwd ?? '/', dir)
      }
      const frags = Path.splitPath(dir)
      const currPaths = stack.value.map((v) => v.curr)
      currPaths.shift() // 是 /
      while (currPaths[0] && frags[0]) {
        if (!isDirNameEqual(currPaths[0], frags[0])) {
          break
        } else {
          currPaths.shift()
          frags.shift()
        }
      }
      for (let index = 0; index < currPaths.length; index++) {
        stack.value.pop()
      }
      if (!frags.length) {
        return refresh()
      }
      for (const frag of frags) {
        const target = currPage.value?.files.find((v) => isDirNameEqual(v.name, frag))
        if (!target) {
          console.error({ frags, frag, stack: cloneDeep(stack.value) })
          throw new Error(`${frag} not found`)
        }
        await openNext(target)
      }
    } catch (error) {
      message.error(t('moveFailedCheckPath') + (error instanceof Error ? error.message : ''))
      console.error(dir, Path.splitPath(dir), currPage.value)
      stack.value = backup
      throw error
    }
  }

  const refresh = makeAsyncFunctionSingle(async () => {
    try {
      np.value?.start()
      if (props.walkModePath) {
        back(0)
        await handleWalkModeTo(props.walkModePath)
      } else {
        const { files } = await getTargetFolderFiles(
          stack.value.length === 1 ? '/' : currLocation.value
        )
        last(stack.value)!.files = files
      }
      scroller.value?.scrollToItem(0)
      message.success(t('refreshCompleted'))
    } finally {
      np.value?.done()
    }
  })

  useGlobalEventListen(
    'return-to-iib',
    makeAsyncFunctionSingle(async () => {
      if (!props.walkModePath) {
        try {
          np.value?.start()
          const { files } = await getTargetFolderFiles(
            stack.value.length === 1 ? '/' : currLocation.value
          )
          const currFiles = last(stack.value)!.files
          if (currFiles.map((v) => v.date).join() !== files.map((v) => v.date).join()) {
            last(stack.value)!.files = files
            message.success(t('autoUpdate'))
          }
        } finally {
          np.value?.done()
        }
      }
    })
  )

  useEventListen.value('refresh', refresh)

  const quickMoveTo = (path: string) => {
    if (props.walkModePath) {
      getPane.value().walkModePath = path
    }
    handleWalkModeTo(path)
  }

  const normalizedScandPath = computed(() => {
    return global.quickMovePaths.map((v) => ({ ...v, path: Path.normalize(v.dir) }))
  })

  const searchPathInfo = computed(() => {
    const c = Path.normalize(currLocation.value)
    const path = normalizedScandPath.value.find((v) => v.path === c)
    return path
  })

  const addToSearchScanPathAndQuickMove = async () => {
    const path = searchPathInfo.value
    if (path) {
      if (!path.can_delete) {
        return
      }
      await removeScannedPath(currLocation.value)
      message.success(t('removeComplete'))
    } else {
      await addScannedPath(currLocation.value)
      message.success(t('addComplete'))
    }
    await globalEvents.emit('updateGlobalSetting')
  }

  const isLocationEditing = ref(false)
  const locInputValue = ref(currLocation.value)
  const onEditBtnClick = () => {
    isLocationEditing.value = true
    locInputValue.value = currLocation.value
  }

  const onLocEditEnter = async () => {
    await to(locInputValue.value)
    isLocationEditing.value = false
  }

  useWatchDocument('click', () => {
    isLocationEditing.value = false
  })

  const share = () => {
    const loc = parent.location
    const baseUrl = loc.href.substring(0, loc.href.length - loc.search.length)
    const params = new URLSearchParams(loc.search)
    params.set('action', 'open')
    params.set('path', currLocation.value)
    const url = `${baseUrl}?${params.toString()}`
    copy2clipboardI18n(url, t('copyLocationUrlSuccessMsg'))
  }

  return {
    locInputValue,
    isLocationEditing,
    onLocEditEnter,
    onEditBtnClick,
    addToSearchScanPathAndQuickMove,
    searchPathInfo,
    refresh,
    copyLocation,
    back,
    openNext,
    currPage,
    currLocation,
    to,
    stack,
    scroller,
    share,
    quickMoveTo
  }
}

export function useFilesDisplay(props: Props) {
  const {
    scroller,
    sortedFiles,
    stack,
    sortMethod,
    currLocation,
    currPage,
    stackViewEl,
    canLoadNext,
    previewIdx
  } = useHookShareState().toRefs()
  const { state } = useHookShareState()
  const moreActionsDropdownShow = ref(false)
  const viewMode = ref(global.defaultViewMode)
  const gridSize = 272
  const profileHeight = 64
  const largeGridSize = gridSize * 2
  const { width } = useElementSize(stackViewEl)
  const gridItems = computed(() => {
    const w = width.value
    if (viewMode.value === 'detailList' || !w) {
      return
    }
    return ~~(w / (viewMode.value === 'previewGrid' ? gridSize : largeGridSize))
  })

  const itemSize = computed(() => {
    const mode = viewMode.value
    if (mode === 'detailList') {
      return { first: 80, second: undefined }
    }
    const second = mode === 'previewGrid' ? gridSize : largeGridSize
    const first = second + profileHeight
    return {
      first,
      second
    }
  })

  const loadNextDirLoading = ref(false)

  const loadNextDir = async () => {
    if (loadNextDirLoading.value || !props.walkModePath || !canLoadNext.value) {
      return
    }
    try {
      loadNextDirLoading.value = true
      const par = stack.value[stack.value.length - 2]
      const parFilesSorted = sortFiles(par.files, sortMethod.value)
      const currIdx = parFilesSorted.findIndex((v) => v.name === currPage.value?.curr)
      if (currIdx !== -1) {
        const next = parFilesSorted[currIdx + 1]
        const p = Path.join(currLocation.value, '../', next.name)
        const r = await getTargetFolderFiles(p)
        const page = currPage.value!
        page.curr = next.name
        if (!page.walkFiles) {
          page.walkFiles = [page.files]
        }
        page.walkFiles.push(r.files)
        console.log('curr page files length', currPage.value?.files.length)
      }
    } catch (e) {
      console.error('loadNextDir', e)
      canLoadNext.value = false
    } finally {
      loadNextDirLoading.value = false
    }
  }

  const fill = async (isFullScreenPreview = false) => {
    const s = scroller.value
    // 填充够一页，直到不行为止
    const currIdx = () => (isFullScreenPreview ? previewIdx.value : s?.$_endIndex ?? 0)
    while (
      !sortedFiles.value.length ||
      (currIdx() > sortedFiles.value.length - 20 && canLoadNext.value)
    ) {
      await delay(100)
      await loadNextDir()
    }
  }

  state.useEventListen('loadNextDir', fill)

  const onScroll = debounce(() => fill(), 300)

  return {
    gridItems,
    sortedFiles,
    sortMethodConv,
    moreActionsDropdownShow,
    viewMode,
    gridSize,
    sortMethod,
    largeGridSize,
    onScroll,
    loadNextDir,
    loadNextDirLoading,
    canLoadNext,
    itemSize
  }
}

const multiSelectTips = () =>
  h(
    'p',
    {
      style: {
        background: 'var(--zp-secondary-background)',
        padding: '8px',
        borderLeft: '4px solid var(--primary-color)'
      }
    },
    `Tips: ${t('multiSelectTips')}`
  )

export function useFileTransfer() {
  const { currLocation, sortedFiles, currPage, multiSelectedIdxs, eventEmitter } =
    useHookShareState().toRefs()
  const recover = () => {
    multiSelectedIdxs.value = []
  }
  useWatchDocument('click', recover)
  useWatchDocument('blur', recover)
  watch(currPage, recover)

  const onFileDragStart = (e: DragEvent, idx: number) => {
    const file = cloneDeep(sortedFiles.value[idx])
    sli.fileDragging = true
    console.log('onFileDragStart set drag file ', e, idx, file)
    const files = [file]
    let includeDir = file.type === 'dir'
    if (multiSelectedIdxs.value.includes(idx)) {
      const selectedFiles = multiSelectedIdxs.value.map((idx) => sortedFiles.value[idx])
      files.push(...selectedFiles)
      includeDir = selectedFiles.some((v) => v.type === 'dir')
    }
    const data: FileTransferData = {
      includeDir,
      loc: currLocation.value || 'search-result',
      path: uniqBy(files, 'fullpath').map((f) => f.fullpath),
      nodes: uniqBy(files, 'fullpath'),
      __id: 'FileTransferData'
    }
    e.dataTransfer!.setData(
      'text/plain',
      JSON.stringify(data)
    )
  }

  const onFileDragEnd = () => {
    sli.fileDragging = false
  }

  const onDrop = async (e: DragEvent) => {
    const data = JSON.parse(e.dataTransfer?.getData('text') ?? '{}')
    if (isFileTransferData(data)) {
      const toPath = currLocation.value
      if (data.loc === toPath) {
        return
      }
      const content = h('div', [
        h('div', `${t('moveSelectedFilesTo')}${toPath}`),
        h(
          'ol',
          data.path.map((v) => v.split(/[/\\]/).pop()).map((v) => h('li', v))
        ),
        multiSelectTips()
      ])
      Modal.confirm({
        title: t('confirm') + '?',
        content,
        maskClosable: true,
        async onOk() {
          await moveFiles(data.path, toPath)
          events.emit('removeFiles', { paths: data.path, loc: data.loc })
          await eventEmitter.value.emit('refresh')
        }
      })
    }
  }
  return {
    onFileDragStart,
    onDrop,
    multiSelectedIdxs,
    onFileDragEnd
  }
}

export function useFileItemActions(
  props: Props,
  { openNext }: { openNext: (file: FileNodeInfo) => Promise<void> }
) {
  const showGenInfo = ref(false)
  const imageGenInfo = ref('')
  const { sortedFiles, previewIdx, multiSelectedIdxs, stack, currLocation, spinning, previewing } =
    useHookShareState().toRefs()
  const nor = Path.normalize
  useEventListen('removeFiles', ({ paths, loc }) => {
    if (nor(loc) !== nor(currLocation.value)) {
      return
    }
    const top = last(stack.value)
    if (!top) {
      return
    }
    top.files = top.files.filter((v) => !paths.includes(v.fullpath))
    if (top.walkFiles) {
      top.walkFiles = top.walkFiles.map((files) =>
        files.filter((file) => !paths.includes(file.fullpath))
      )
    }
  })

  useEventListen('addFiles', ({ files, loc }) => {
    if (nor(loc) !== nor(currLocation.value)) {
      return
    }
    const top = last(stack.value)
    if (!top) {
      return
    }

    top.files.unshift(...files)
  })

  const q = createReactiveQueue()
  const onFileItemClick = async (e: MouseEvent, file: FileNodeInfo, idx: number) => {
    previewIdx.value = idx
    global.fullscreenPreviewInitialUrl = toRawFileUrl(file)
    const idxInSelected = multiSelectedIdxs.value.indexOf(idx)
    if (e.shiftKey) {
      if (idxInSelected !== -1) {
        multiSelectedIdxs.value.splice(idxInSelected, 1)
      } else {
        multiSelectedIdxs.value.push(idx)
        multiSelectedIdxs.value.sort((a, b) => a - b)
        const first = multiSelectedIdxs.value[0]
        const last = multiSelectedIdxs.value[multiSelectedIdxs.value.length - 1]
        multiSelectedIdxs.value = range(first, last + 1)
      }
      e.stopPropagation()
    } else if (e.ctrlKey || e.metaKey) {
      if (idxInSelected !== -1) {
        multiSelectedIdxs.value.splice(idxInSelected, 1)
      } else {
        multiSelectedIdxs.value.push(idx)
      }
      e.stopPropagation()
    } else {
      await openNext(file)
    }
  }

  const onContextMenuClick = async (e: MenuInfo, file: FileNodeInfo, idx: number) => {
    const url = toRawFileUrl(file)
    const path = currLocation.value

    /**
     * 获取选中的图片信息
     *  选中的图片信息数组
     */
    const getSelectedImg = () => {
      let selectedFiles: FileNodeInfo[] = []
      if (multiSelectedIdxs.value.includes(idx)) {
        // 如果索引已被选中，则获取所有已选中的图片信息
        selectedFiles = multiSelectedIdxs.value.map((idx) => sortedFiles.value[idx])
      } else {
        // 否则，只获取当前图片信息
        selectedFiles.push(file)
      }
      return selectedFiles
    }
    const copyImgTo = async (tab: ['txt2img', 'img2img', 'inpaint', 'extras'][number]) => {
      if (spinning.value) {
        return
      }
      try {
        spinning.value = true
        await setImgPath(file.fullpath) // 设置图像路径
        imgTransferBus.postMessage('iib_hidden_img_update_trigger') // 触发图像组件更新
        const warnId = setTimeout(
          () => notification.warn({ message: t('long_loading'), duration: 20 }),
          5000
        )
        // ok(await genInfoCompleted(), 'genInfoCompleted timeout') // 等待消息生成完成
        await genInfoCompleted() // 等待消息生成完成
        clearTimeout(warnId)
        imgTransferBus.postMessage(`iib_hidden_tab_${tab}`) // 触发粘贴
      } catch (error) {
        console.error(error)
        message.error('发送图像失败，请携带console的错误消息找开发者')
      } finally {
        spinning.value = false
      }
    }
    if (`${e.key}`.startsWith('toggle-tag-')) {
      const tagId = +`${e.key}`.split('toggle-tag-')[1]
      const { is_remove } = await toggleCustomTagToImg({ tag_id: tagId, img_path: file.fullpath })
      const tag = global.conf?.all_custom_tags.find((v) => v.id === tagId)?.name!
      message.success(t(is_remove ? 'removedTagFromImage' : 'addedTagToImage', { tag }))
      return
    }
    switch (e.key) {
      case 'previewInNewWindow':
        return window.open(url)
      case 'download':
        return window.open(toRawFileUrl(file, true))
      case 'copyPreviewUrl': {
        return copy2clipboardI18n(parent.document.location.origin + url)
      }
      case 'send2txt2img':
        return copyImgTo('txt2img')
      case 'send2img2img':
        return copyImgTo('img2img')
      case 'send2inpaint':
        return copyImgTo('inpaint')
      case 'send2extras':
        return copyImgTo('extras')
      case 'send2savedDir': {
        const dir = global.quickMovePaths.find((v) => v.key === 'outdir_save')
        if (!dir) {
          return message.error(t('unknownSavedDir'))
        }
        const absolutePath = Path.normalizeRelativePathToAbsolute(dir.dir, global.conf?.sd_cwd!)
        const selectedImg = getSelectedImg()
        await moveFiles(
          selectedImg.map((v) => v.fullpath),
          absolutePath
        )
        events.emit('removeFiles', {
          paths: selectedImg.map((v) => v.fullpath),
          loc: currLocation.value
        })
        events.emit('addFiles', { files: selectedImg, loc: absolutePath })
        break
      }
      case 'send2controlnet-img2img':
      case 'send2controlnet-txt2img': {
        const appDoc = gradioApp()
        const par = parentWindow()
        const type = e.key.split('-')[1] as 'img2img' | 'txt2img'
        type === 'img2img' ? par.switch_to_img2img() : par.switch_to_txt2img()
        await delay(100)
        const cn = appDoc.querySelector(`#${type}_controlnet`) as HTMLDivElement
        const wrap = cn.querySelector('.label-wrap') as HTMLDivElement
        if (!wrap.className.includes('open')) {
          wrap.click()
          await delay(100)
        }
        wrap.scrollIntoView()
        const response = await fetch(toRawFileUrl(file))
        const imageBlob = await response.blob()
        const imageFile = new File([imageBlob], 'image.jpg', {
          type: imageBlob.type,
          lastModified: Date.now()
        })
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(imageFile)
        const pasteEvent = new ClipboardEvent('paste', {
          clipboardData: dataTransfer,
          bubbles: true
        })
        wrap.dispatchEvent(pasteEvent)
        break
      }
      case 'openWithWalkMode': {
        stackCache.set(path, stack.value)
        const tab = global.tabList[props.tabIdx]
        const pane: FileTransferTabPane = {
          type: 'local',
          key: uniqueId(),
          path: file.fullpath,
          name: t('local'),
          stackKey: path,
          walkModePath: file.fullpath
        }
        tab.panes.push(pane)
        tab.key = pane.key
        break
      }
      case 'openInNewTab': {
        stackCache.set(path, stack.value)
        const tab = global.tabList[props.tabIdx]
        const pane: FileTransferTabPane = {
          type: 'local',
          key: uniqueId(),
          path: file.fullpath,
          name: t('local'),
          stackKey: path
        }
        tab.panes.push(pane)
        tab.key = pane.key
        break
      }
      case 'openOnTheRight': {
        stackCache.set(path, stack.value)
        let tab = global.tabList[props.tabIdx + 1]
        if (!tab) {
          tab = { panes: [], key: '', id: uniqueId() }
          global.tabList[props.tabIdx + 1] = tab
        }
        const pane: FileTransferTabPane = {
          type: 'local',
          key: uniqueId(),
          path: file.fullpath,
          name: t('local'),
          stackKey: path
        }
        tab.panes.push(pane)
        tab.key = pane.key
        break
      }
      case 'viewGenInfo': {
        showGenInfo.value = true
        imageGenInfo.value = await q.pushAction(() => getImageGenerationInfo(file.fullpath)).res
        break
      }
      case 'openWithLocalFileBrowser': {
        await openFolder(file.fullpath)
        break
      }
      case 'deleteFiles': {
        const selectedFiles = getSelectedImg()
        await new Promise<void>((resolve) => {
          Modal.confirm({
            title: t('confirmDelete'),
            maskClosable: true,
            content: h('div', [
              h(
                'ol',
                { style: 'max-height:50vh;overflow:auto;' },
                selectedFiles.map((v) => v.fullpath.split(/[/\\]/).pop()).map((v) => h('li', v))
              ),
              multiSelectTips()
            ]),
            async onOk() {
              const paths = selectedFiles.map((v) => v.fullpath)
              await deleteFiles(paths)
              message.success(t('deleteSuccess'))
              events.emit('removeFiles', { paths: paths, loc: currLocation.value })
              resolve()
            }
          })
        })
        break
      }
    }
    return {}
  }

  useWatchDocument('keydown', (e) => {
    if (previewing.value) {
      const keys = [] as string[]
      if (e.shiftKey) {
        keys.push('Shift')
      }
      if (e.ctrlKey) {
        keys.push('Ctrl')
      }
      if (e.code.startsWith('Key') || e.code.startsWith('Digit')) {
        keys.push(e.code)
        const keysStr = keys.join(' + ')
        const action = Object.entries(global.shortcut).find(
          (v) => v[1] === keysStr
        )?.[0] as keyof Shortcut
        if (action) {
          // message.info(t('shortcutTrigger', { action: t(action) }))
          e.stopPropagation()
          e.preventDefault()
          const idx = previewIdx.value
          const file = sortedFiles.value[idx]
          switch (action) {
            case 'delete': {
              if (toRawFileUrl(file) === global.fullscreenPreviewInitialUrl) {
                return message.warn(t('fullscreenRestriction'))
              }
              return onContextMenuClick({ key: 'deleteFiles' } as MenuInfo, file, idx)
            }
            default: {
              const name = /^toggle_tag_(.*)$/.exec(action)?.[1]
              const tag = global.conf?.all_custom_tags.find((v) => v.name === name)
              if (!tag) return
              return onContextMenuClick({ key: `toggle-tag-${tag.id}` } as MenuInfo, file, idx)
            }
          }
        }
      }
    }
  })

  return {
    onFileItemClick,
    onContextMenuClick,
    showGenInfo,
    imageGenInfo,
    q
  }
}

/**
 * 针对移动端端操作优化，使用长按提到右键
 */
export const useMobileOptimization = () => {
  const { stackViewEl } = useHookShareState().toRefs()
  const showMenuIdx = ref(-1)
  onLongPress(stackViewEl, (e) => {
    let fileEl = e.target as HTMLDivElement
    while (fileEl.parentElement) {
      fileEl = fileEl.parentElement as any
      if (fileEl.tagName.toLowerCase() === 'li' && fileEl.classList.contains('file-item-trigger')) {
        const idx = fileEl.dataset?.idx
        if (idx && Number.isSafeInteger(+idx)) {
          showMenuIdx.value = +idx
        }
        return
      }
    }
  })
  return {
    showMenuIdx
  }
}
