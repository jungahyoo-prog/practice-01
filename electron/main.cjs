const { app, BrowserWindow, shell } = require('electron')
const http = require('node:http')
const path = require('node:path')
const fs = require('node:fs')
const handler = require('serve-handler')

let mainWindow = null
let staticServer = null
const DESKTOP_APP_HOST = '127.0.0.1'
const DESKTOP_APP_PORT = 43123

function isInAppOAuthUrl(rawUrl) {
  try {
    const parsedUrl = new URL(rawUrl)
    const allowedHosts = new Set([
      'accounts.google.com',
      'oauth2.googleapis.com',
      '127.0.0.1',
      'localhost',
    ])

    if (allowedHosts.has(parsedUrl.hostname)) {
      return true
    }

    return parsedUrl.pathname.includes('/auth/v1/authorize')
  } catch {
    return false
  }
}

function getStaticRoot() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'out')
  }

  return path.join(app.getAppPath(), 'out')
}

function startStaticServer() {
  const publicRoot = getStaticRoot()

  return new Promise((resolve, reject) => {
    staticServer = http.createServer((request, response) => {
      const requestUrl = new URL(request.url ?? '/', `http://${DESKTOP_APP_HOST}:${DESKTOP_APP_PORT}`)
      const pathname = decodeURIComponent(requestUrl.pathname)
      const normalizedPath = pathname.replace(/^\/+/, '')
      const diskPath = path.join(publicRoot, normalizedPath)
      const hasFileExtension = path.extname(pathname) !== ''

      if (pathname === '/' || (!hasFileExtension && !fs.existsSync(diskPath))) {
        request.url = '/index.html'
      }

      return handler(request, response, {
        public: publicRoot,
        cleanUrls: false,
        directoryListing: false,
      })
    })

    staticServer.on('error', reject)

    staticServer.listen(DESKTOP_APP_PORT, DESKTOP_APP_HOST, () => {
      const address = staticServer.address()

      if (!address || typeof address === 'string') {
        reject(new Error('DESKTOP_SERVER_ADDRESS_UNAVAILABLE'))
        return
      }

      resolve(`http://${DESKTOP_APP_HOST}:${address.port}`)
    })
  })
}

async function createMainWindow() {
  const serverUrl = await startStaticServer()

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 980,
    minWidth: 1180,
    minHeight: 780,
    backgroundColor: '#f7f9fc',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isInAppOAuthUrl(url)) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 520,
          height: 760,
          autoHideMenuBar: true,
          modal: true,
          parent: mainWindow,
          backgroundColor: '#ffffff',
          webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
          },
        },
      }
    }

    void shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  await mainWindow.loadURL(`${serverUrl}/index.html`)
}

app.whenReady().then(async () => {
  await createMainWindow()

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  staticServer?.close()
  staticServer = null
})
