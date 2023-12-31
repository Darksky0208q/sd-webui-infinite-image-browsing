<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import fileItemCell from '@/page/fileTransfer/FileItem.vue'
import '@zanllp/vue-virtual-scroller/dist/vue-virtual-scroller.css'
// @ts-ignore
import { RecycleScroller } from '@zanllp/vue-virtual-scroller'
import { toRawFileUrl } from '@/page/fileTransfer/hook'
import { getDbBasicInfo, getExpiredDirs, getImagesBySubstr, updateImageData, type DataBaseBasicInfo } from '@/api/db'
import { copy2clipboardI18n, makeAsyncFunctionSingle, useGlobalEventListen } from '@/util'
import fullScreenContextMenu from '@/page/fileTransfer/fullScreenContextMenu.vue'
import { LeftCircleOutlined, RightCircleOutlined } from '@/icon'
import { message } from 'ant-design-vue'
import { t } from '@/i18n'
import { useImageSearch } from './hook'
const {
  queue,
  images,
  onContextMenuClickU,
  stackViewEl,
  previewIdx,
  previewing,
  onPreviewVisibleChange,
  previewImgMove,
  canPreview,
  itemSize,
  gridItems,
  showGenInfo,
  imageGenInfo,
  q: genInfoQueue,
  multiSelectedIdxs,
  onFileItemClick,
  scroller,
  showMenuIdx,
  onFileDragStart,
  onFileDragEnd
} = useImageSearch()
const substr = ref('')

const info = ref<DataBaseBasicInfo>()

onMounted(async () => {
  info.value = await getDbBasicInfo()
  if (info.value.img_count && info.value.expired) {
    onUpdateBtnClick()
  }
})

const onUpdateBtnClick = makeAsyncFunctionSingle(
  () =>
    queue.pushAction(async () => {
      await updateImageData()
      info.value = await getDbBasicInfo()
      return info.value
    }).res
)
const query = async () => {
  images.value = await queue.pushAction(() => getImagesBySubstr(substr.value)).res
  scroller.value?.scrollToItem(0)
  if (!images.value.length) {
    message.info(t('fuzzy-search-noResults'))
  }
}

useGlobalEventListen('return-to-iib', async () => {
  const res = await queue.pushAction(getExpiredDirs).res
  info.value!.expired = res.expired
})

</script>
<template>
  <div class="container" ref="stackViewEl">
    <div class="search-bar" v-if="info" >
      <a-input v-model:value="substr" :placeholder="$t('fuzzy-search-placeholder')" :disabled="!queue.isIdle" @keydown.enter="query"/>
      <AButton @click="onUpdateBtnClick" :loading="!queue.isIdle" type="primary" v-if="info.expired || !info.img_count">
        {{ info.img_count === 0 ? $t('generateIndexHint') : $t('UpdateIndex') }}</AButton>
      <AButton v-else type="primary" @click="query" :loading="!queue.isIdle" :disabled="!substr">{{
        $t('search') }}
      </AButton>
    </div>
    <ASpin size="large" :spinning="!queue.isIdle">
      <AModal v-model:visible="showGenInfo" width="70vw" mask-closable @ok="showGenInfo = false">
        <template #cancelText />
        <ASkeleton active :loading="!genInfoQueue.isIdle">
          <div style="
                            width: 100%;
                              word-break: break-all;
                              white-space: pre-line;
                              max-height: 70vh;
                              overflow: auto;
                            " @dblclick="copy2clipboardI18n(imageGenInfo)">
            <div class="hint">{{ $t('doubleClickToCopy') }}</div>
            {{ imageGenInfo }}
          </div>
        </ASkeleton>
      </AModal>
      <RecycleScroller ref="scroller" class="file-list" v-if="images" :items="images" :item-size="itemSize.first"
        key-field="fullpath" :item-secondary-size="itemSize.second" :gridItems="gridItems">
        <template v-slot="{ item: file, index: idx }">
          <!-- idx 和file有可能丢失 -->
          <file-item-cell :idx="idx" :file="file" v-model:show-menu-idx="showMenuIdx" @file-item-click="onFileItemClick"
            :full-screen-preview-image-url="images[previewIdx] ? toRawFileUrl(images[previewIdx]) : ''"
            :selected="multiSelectedIdxs.includes(idx)" @context-menu-click="onContextMenuClickU"
            @dragstart="onFileDragStart" @dragend="onFileDragEnd"
            @preview-visible-change="onPreviewVisibleChange" />
        </template>
      </RecycleScroller>
      <div v-if="previewing" class="preview-switch">
        <LeftCircleOutlined @click="previewImgMove('prev')" :class="{ disable: !canPreview('prev') }" />
        <RightCircleOutlined @click="previewImgMove('next')" :class="{ disable: !canPreview('next') }" />
      </div>
    </ASpin>
    <fullScreenContextMenu v-if="previewing && images && images[previewIdx]" :file="images[previewIdx]" :idx="previewIdx"
      @context-menu-click="onContextMenuClickU" />
  </div>
</template>
<style scoped lang="scss">
.search-bar {
  padding: 8px;
  display: flex;
}

.preview-switch {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 11111;
  pointer-events: none;

  &>* {
    color: white;
    margin: 16px;
    font-size: 4em;
    pointer-events: all;
    cursor: pointer;

    &.disable {
      opacity: 0;
      pointer-events: none;
      cursor: none;
    }
  }
}

.container {
  background: var(--zp-secondary-background);

  .file-list {
    list-style: none;
    padding: 8px;
    height: 100%;
    overflow: auto;
    height: var(--pane-max-height);
    width: 100%;
  }
}
</style>
