const {app, globalShortcut, clipboard, Menu, dialog} = require('electron')

var c = require('electron-config');
var config = new c();

var notifier = require('node-notifier');

var emitter = require('event-emitter');
var bus = new emitter({})

var screenshot = require('./screenshot.js');
var screenCapture = new screenshot()
screenCapture.setEventBus(bus)

var dropbox = require('./dropbox.js');
var service = new dropbox();
service.setEventBus(bus)
service.setToken(config.get('token'))

app.on('ready', () => {  
  app.dock.setMenu(
    Menu.buildFromTemplate([{ label: 'Logout', click: () => { service.clearToken(); } }])
  )

  if (service.isAuthorized() === false) {
    service.startAuthorization()
  }

  globalShortcut.register('Command+Shift+1', () => {
    if (service.isAuthorized()) {
      screenCapture.makeScreenshot()
    } else {
      service.startAuthorization()
    }
  })
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {})

bus.on('screenshot-captured', (filePath) => {
  clipboard.writeText('')
  service.uploadImage(filePath)
})

bus.on('image-uploaded', (url) => {
  clipboard.writeText(url)
  app.dock.bounce();
})

bus.on('image-upload-error', (title, message) => {
  notifier.notify({
    title: title, 
    message: message
  });
})

bus.on('new-token', (token) => {
  config.set('token', token)
})


