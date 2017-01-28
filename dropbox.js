var dropbox = function (){  
	const callbackUrl = 'http://localhost:1000'
	const appId = 'armz80vgyxkaspg'

	var browserWindow = require('electron').BrowserWindow
	var session = require('electron').session

	var fs = require('fs')

	var dropboxModule = require('dropbox')
	var dropboxClient

	var bus
	var self = this

	self.setEventBus = (eventBus) => {
		bus = eventBus
	}

	self.setToken = (token) => {
		dropboxClient = new dropboxModule({
			accessToken: token
		});
	}

	self.clearToken = () => {
		bus.emit('new-token', '')
		dropboxClient.setAccessToken('')
	}

	self.isAuthorized = () => {
		return typeof dropboxClient.getAccessToken() != 'undefined'
		&& dropboxClient.getAccessToken().length > 0
	}

	self.processCallbackUrl = (url) => {
		if (url.startsWith(callbackUrl)) {
			var token = url.match(/access_token=(.+?)&/)[1]
			self.setToken(token)

			bus.emit('new-token', token)

			return false
		} else {
			return true
		}
	}

	self.startAuthorization = () => {
		if (typeof mainWindow !== 'undefined' && mainWindow.isVisible()) {
			mainWindow.focus()
			return
		}

		mainWindow = new browserWindow({
			title: '', 
			width: 800, 
			height: 600, 
			frame: true
		})

		mainWindow.loadURL("https://www.dropbox.com/1/oauth2/authorize?response_type=token&client_id=" + appId + "&redirect_uri=" + callbackUrl)
		session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
			if (self.processCallbackUrl(details.url)) {
				callback({})
			} else {
				mainWindow.close()
				mainWindow = null
			}
		})
	}

	self.uploadImage = (filePath) => {
		fs.readFile(filePath, (err, file) => {
			var filename = '/' + ("0000" + (Math.random()*Math.pow(36,4) << 0).toString(36)).slice(-4) + '.png';
			var optionsForUpload = { path: filename, contents: file, mute: true }
			var optionsForLinkShare = { path: filename, settings: { requested_visibility: 'public' } }

			dropboxClient.filesUpload(optionsForUpload).then((response) => {
				dropboxClient.sharingCreateSharedLinkWithSettings(optionsForLinkShare).then((response) => {
					bus.emit('image-uploaded', response.url.replace('?dl=0', '?raw=1'))
				}).catch((res) => {
					bus.emit('image-upload-error', "Link sharing failed", res.error)
				})
			}).catch((res) => {
				bus.emit('image-upload-error', "Image upload failed", res.error)
			})
		})
	}
};

module.exports = dropbox