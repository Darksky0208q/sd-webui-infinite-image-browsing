import { Input, Modal, message } from 'ant-design-vue'
import axios, { isAxiosError } from 'axios'
import type { GlobalSettingPart } from './type'
import { t } from '@/i18n'
import type { Tag } from './db'
import cookie from 'js-cookie'
import { delay } from 'vue3-ts-util'
import { h, ref } from 'vue'
import 'ant-design-vue/es/input/style/index.css'
import sjcl from 'sjcl'
export const axiosInst = axios.create({
  baseURL: '/infinite_image_browsing'
})

const sha256 = (data: string) => {
  const hash = sjcl.hash.sha256.hash(data)
  return sjcl.codec.hex.fromBits(hash)
}

axiosInst.interceptors.response.use(
  (resp) => resp,
  async (err) => {
    if (isAxiosError(err)) {
      if (err.response?.status === 401) {
        const key = await new Promise<string>((resolve) => {
          const key = ref('')
          Modal.confirm({
            title: t('serverKeyRequired'),
            content: () => {
              return h(Input, {
                value: key.value,
                'onUpdate:value': (v: string) => (key.value = v)
              })
            },
            onOk() {
              resolve(key.value)
            }
          })
        })
        if (!key) {
          return
        }
        cookie.set('IIB_S', sha256(key + '_ciallo'))
        await delay(100)
        location.reload()
      }
      const errmsg = err.response?.data?.detail ?? t('errorOccurred')
      message.error(errmsg)
      throw new Error(errmsg)
    }
    return err
  }
)
export const greeting = async () => {
  const resp = await axiosInst.get('hello')
  return resp.data as string
}

export interface GlobalConf {
  all_custom_tags: Tag[]
  global_setting: GlobalSettingPart
  is_win: boolean
  cwd: string
  home: string
  sd_cwd: string
  extra_paths: { path: string }[]
  enable_access_control: boolean
}

export const getGlobalSetting = async () => {
  const resp = await axiosInst.get('/global_setting')
  return resp.data as GlobalConf
}

export const checkPathExists = async (paths: string[]) => {
  const resp = await axiosInst.post('/check_path_exists', { paths })
  return resp.data as Record<string, boolean>
}

export const setImgPath = async (path: string) => {
  return axiosInst.post(`/send_img_path?path=${encodeURIComponent(path)}`)
}

export const genInfoCompleted = async () => {
  return (await axiosInst.get(`/gen_info_completed`, { timeout: 60_000 })).data as boolean
}

export const getImageGenerationInfo = async (path: string) => {
  return (await axiosInst.get(`/image_geninfo?path=${encodeURIComponent(path)}`)).data as string
}

export const openFolder = async (path: string) => {
  await axiosInst.post('/open_folder', { path })
}
