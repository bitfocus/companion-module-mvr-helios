const { InstanceBase, Regex, runEntrypoint, InstanceStatus } = require('@companion-module/base')
const actions = require('./actions')
const feedbacks = require('./feedbacks')
const presets = require('./presets')
const variables = require('./variables')
const requests = require('./requests')

// Constants
const pollIntervalMs = 1000

class instance extends InstanceBase {
	constructor(internal) {
		super(internal)

		Object.assign(this, {
			...actions,
			...feedbacks,
			...presets,
			...variables,
			...requests,
		})

		this.updateStatus(InstanceStatus.Disconnected)
	}

	async init(config, firstInit) {
		this.config = config

		// Variables
		this.timer = undefined
		this.loggedError = false // Stops the poll flooding the log
		this.firstAttempt = true
		this.timestampOfRequest = Date.now()

		this.configurations = []
		this.groups = []

		this.updateActions()
		this.initFeedback()
		this.updatePresets()
		this.initVariables()

		this.startPolling()
	}

	async destroy() {
		this.stopPolling()
		this.log('debug', 'destroy')
	}

	getConfigFields() {
		return [
			{
				type: 'static-text',
				id: 'info',
				width: 12,
				label: 'Information',
				value: 'This works with all Helios configurations.',
			},
			{
				type: 'static-text',
				id: 'info',
				width: 12,
				label: 'Firmware',
				value: 'Latest supported firmware version: HELIOS v22.12',
			},
			{
				type: 'textinput',
				id: 'ip',
				label: 'Target IP',
				width: 6,
				regex: Regex.IP,
			},
		]
	}

	async configUpdated(config) {
		this.config = config
		this.startPolling()
	}

	startPolling = function () {
		this.log('debug', 'start polling')
		if (this.timer === undefined) {
			this.timer = setInterval(this.poll.bind(this), pollIntervalMs)
		}

		this.poll()
	}

	stopPolling() {
		let self = this

		if (self.timer !== undefined) {
			clearInterval(self.timer)
			delete self.timer
		}
	}

	async poll() {
		await this.sendGetRequest('/api/v1/public')
			.then((response) => {
				if (response !== undefined) {
					this.updateVariables(response, false)
				}
			})
			.catch(() => {
				if (!this.loggedError) {
					this.log('error', 'Helios setting polling failed.')
				}
			})

		await this.sendGetRequest('/api/v1/presets')
			.then((response) => {
				if (response !== undefined) {
					let configurations = []
					for (let preset of response.presets) {
						configurations.push({ id: preset.presetName, label: preset.presetName })
					}
					this.configurations = configurations
				}
			})
			.catch(() => {
				if (!this.loggedError) {
					this.log('error', 'Helios preset polling failed')
				}
			})

		this.updateActions()
		this.updatePresets()
	}

	setPreset(data) {
		this.sendPostRequest('/api/v1/presets/apply', data)
	}

	getInputs() {
		if (this.inputs !== undefined) {
			return this.inputs
		}

		return [
			'hdmi',
			'hdmi1',
			'hdmi2',
			'hdmi1X2',
			'hdmi2X1',
			'dp',
			'dp1',
			'dp2',
			'dp1X2',
			'dp2X1',
			'sdi1',
			'sdi2',
			'sdi3',
			'sdi4',
			'sdi1X2',
			'sdi1X3',
			'sdi1X4',
			'sdi2X1',
			'sdi2X2',
			'sdi3X1',
			'sdi4X1',
		]
	}

	getInputsLabeled() {
		let inputs = []
		for (let input of this.getInputs()) {
			inputs.push({ id: input, label: input.toUpperCase() })
		}
		return inputs
	}

	getGroups() {
		let groups = []
		let index = 0
		for (let group of this.groups) {
			groups.push({ id: index, label: group.name })
			index++
		}
		return groups
	}
}

runEntrypoint(instance, [])
