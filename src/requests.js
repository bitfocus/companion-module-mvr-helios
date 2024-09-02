const { InstanceStatus } = require('@companion-module/base')

exports.sendGetRequest = function (patch) {
	let self = this

	const request = new Request('http://' + self.config.ip + patch, {
		method: 'GET',
	})

	return self.sendFetch(request, true)
}

exports.sendPostRequest = function (patch, data) {
	let self = this

	const request = new Request('http://' + self.config.ip + patch, {
		method: 'POST',
		body: JSON.stringify(data),
		headers: {
			'Content-type': 'application/json',
		},
	})

	self
		.sendFetch(request, false)
		.then((response) => self.updateVariables(response, true))
		.catch((error) => self.log('error', 'Patch failed: ' + error))
}

exports.sendPatchRequest = function (data) {
	let self = this

	const request = new Request('http://' + self.config.ip + '/api/v1/public', {
		method: 'POST',
		body: JSON.stringify(data),
		headers: {
			'Content-type': 'application/json',
		},
	})

	self
		.sendFetch(request, false)
		.then((response) => self.updateVariables(response, true))
		.catch((error) => self.log('error', 'Patch failed: ' + error))
}

exports.sendFetch = function (request, isPoll) {
	let self = this
	return new Promise(async function (resolve, reject) {
		if (isPoll && self.requestWaiting) {
			return reject('Request still in the air')
		} else if (isPoll) {
			self.requestWaiting = true
		}

		const timestamp = Date.now()

		// Check if the IP was set.
		if (self.config.ip === undefined || self.config.ip.length === 0) {
			if (self.loggedError === false) {
				let msg = 'IP is not set'
				self.log('error', msg)
				self.updateStatus(InstanceStatus.BadConfig, msg)
				self.loggedError = true
			}

			self.timestampOfRequest = timestamp
			reject('IP not set')
		}

		fetch(request) // api for the get request
			.then((response) => {
				if (response.ok) {
					if (self.loggedError === true || self.firstAttempt) {
						self.log('debug', 'HTTP connection succeeded to ' + self.config.ip)
						self.updateStatus(InstanceStatus.Ok)
						self.loggedError = false
						self.firstAttempt = false
					}
					return response.json()
				} else {
					self.updateStatus(InstanceStatus.ConnectionFailure, `Response status: ${response.status}`)
					throw new Error(`Response status: ${response.status}`);
				}
			})
			.then((data) => {
				resolve(data)
			})
			.catch((error) => {
				self.log('error', JSON.stringify(error))
				if (error === 'TypeError: fetch failed') {
					self.updateStatus(InstanceStatus.ConnectionFailure, `Unable to connect`)
				}
				if (self.loggedError === false) {
					self.log('error', 'HTTP Request ' +request.url + ' failed (' + error + ')')
					self.loggedError = true
				}
				reject(error)
			})
			.finally(() => {
				if (isPoll) {
					self.requestWaiting = false
				}
			})
	})
}
