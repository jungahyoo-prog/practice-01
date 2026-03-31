const DEVICE_ID_KEY = 'FLO_DEVICE_ID'

export function getDeviceId(): string {
  if (typeof localStorage === 'undefined') {
    return `web_${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`
  }

  let deviceId = localStorage.getItem(DEVICE_ID_KEY)
  if (!deviceId) {
    const uuid =
      crypto.randomUUID?.() ||
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
      })
    deviceId = `web_${uuid.replace(/-/g, '')}`
    localStorage.setItem(DEVICE_ID_KEY, deviceId)
  }

  return deviceId
}

export const setDeviceId = () => {
  if (localStorage.getItem(DEVICE_ID_KEY)) {
    return
  }
  getDeviceId()
}
