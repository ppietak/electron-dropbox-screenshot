var screenshot = function (){  
	const filePath = '/var/tmp/geto.png';

	var shell = require('shelljs');
	shell.config.execPath = '/usr/local/bin/node';

	var bus
	var self = this

	self.setEventBus = (eventBus) => {
		bus = eventBus
	}

	self.makeScreenshot = function () {
		shell.rm(filePath)
		shell.exec('screencapture -i ' + filePath)

		if (shell.test('-e', filePath)) {
			bus.emit('screenshot-captured', filePath)
		}
	}
};

module.exports = screenshot;