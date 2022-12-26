const { InstanceBase, Regex, runEntrypoint, combineRgb, InstanceStatus } = require('@companion-module/base')
const request = require('request')

// Constants
const pollIntervalMs = 1000
const timeoutMs = 2000

class instance extends InstanceBase {
	constructor(internal) {
		super(internal)

		this.updateStatus(InstanceStatus.Disconnected)
	}

	async init(config) {
		let self = this

		this.config = config

		// Variables
		self.timer = undefined
		self.loggedError = false // Stops the poll flooding the log
		self.firstAttempt = true
		self.timestampOfRequest = Date.now()

		this.configurations = []

		self.initActions()
		self.initFeedback()
		self.initPresets()
		self.initVariables()

		self.startPolling()
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
				value: 'This works with all Helios models.',
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

	initActions() {
		let self = this
		let actions = {}

		actions['set_blackout'] = {
			name: 'Blackout',
			options: [
				{
					type: 'dropdown',
					label: 'Select State',
					id: 'bo',
					default: 'toggle',
					choices: [
						{ id: 'true', label: 'Enable' },
						{ id: 'false', label: 'Disable' },
						{ id: 'toggle', label: 'Toggle' },
					],
				},
			],
			callback: (event) => {
				let opt = event.options
				let value
				if (opt.bo === 'toggle') {
					value = !self.blackout
				} else {
					value = opt.bo === 'true'
				}
				let object = {}
				object['dev'] = {
					display: {
						blackout: value,
					},
				}
				self.sendPatch(object)
			},
		}

		actions['set_freeze'] = {
			name: 'Freeze',
			options: [
				{
					type: 'dropdown',
					label: 'Select State',
					id: 'freeze',
					default: 'toggle',
					choices: [
						{ id: 'true', label: 'Enable' },
						{ id: 'false', label: 'Disable' },
						{ id: 'toggle', label: 'Toggle' },
					],
				},
			],
			callback: (event) => {
				let opt = event.options
				let value
				if (opt.freeze === 'toggle') {
					value = !self.freeze
				} else {
					value = opt.freeze === 'true'
				}
				let object = {}
				object['dev'] = {
					display: {
						freeze: value,
					},
				}
				self.sendPatch(object)
			},
		}

		actions['set_input'] = {
			name: 'Input',
			options: [
				{
					type: 'dropdown',
					label: 'Select Input',
					id: 'input',
					default: '',
					choices: this.getInputsLabeled(),
				},
			],
			callback: (event) => {
				let object = {}
				object['dev'] = {
					ingest: {
						input: event.options.input,
					},
				}
				self.sendPatch(object)
			},
		}

		actions['set_brightness'] = {
			name: 'Screen Brightness',
			options: [
				{
					type: 'number',
					label: 'Brightness',
					id: 'brightness',
					min: 0,
					max: 100,
					default: 50,
					step: 0.01,
					required: true,
					range: true,
				},
			],
			callback: (event) => {
				let object = {}
				object['dev'] = {
					display: {
						brightness: event.options.brightness,
					},
				}
				self.sendPatch(object)
			},
		}

		actions['set_gamma'] = {
			name: 'Screen Gamma',
			options: [
				{
					type: 'number',
					label: 'Gamma',
					id: 'gamma',
					min: 0,
					max: 4,
					default: 2.4,
					step: 0.1,
					required: true,
					range: true,
				},
			],
			callback: (event) => {
				let object = {}
				object['dev'] = {
					display: {
						gamma: event.options.gamma,
					},
				}
				self.sendPatch(object)
			},
		}

		actions['set_cct'] = {
			name: 'Screen Color Temperature',
			options: [
				{
					type: 'number',
					label: 'Temperature',
					id: 'temp',
					min: 1667,
					max: 10000,
					default: 6504,
					step: 1,
					required: true,
					range: true,
				},
			],
			callback: (event) => {
				let object = {}
				object['dev'] = {
					display: {
						cct: event.options.temp,
					},
				}
				self.sendPatch(object)
			},
		}

		actions['set_resolution'] = {
			name: 'Canvas Resolution',
			options: [
				{
					type: 'number',
					label: 'Width',
					id: 'width',
					min: 0,
					max: 8192,
					default: 1920,
					step: 1,
					required: true,
				},
				{
					type: 'number',
					label: 'Height',
					id: 'height',
					min: 0,
					max: 4320,
					default: 1080,
					step: 1,
					required: true,
				},
			],
			callback: (event) => {
				let object = {}
				object['dev'] = {
					display: {
						width: event.options.width,
						height: event.options.height,
					},
				}
				self.sendPatch(object)
			},
		}

		actions['set_position'] = {
			name: 'Canvas Position',
			options: [
				{
					type: 'number',
					label: 'X',
					id: 'x',
					default: 0,
					step: 1,
					required: true,
				},
				{
					type: 'number',
					label: 'Y',
					id: 'y',
					default: 0,
					step: 1,
					required: true,
				},
			],
			callback: (event) => {
				let object = {}
				object['dev'] = {
					display: {
						x: event.options.x,
						y: event.options.y,
					},
				}
				self.sendPatch(object)
			},
		}

		actions['set_show_test'] = {
			name: 'Show Test Pattern',
			options: [
				{
					type: 'dropdown',
					label: 'Select State',
					id: 'show',
					default: 'toggle',
					choices: [
						{ id: 'true', label: 'Enable' },
						{ id: 'false', label: 'Disable' },
						{ id: 'toggle', label: 'Toggle' },
					],
				},
			],
			callback: (event) => {
				let opt = event.options
				let value
				if (opt.show === 'toggle') {
					value = !self.test_enabled
				} else {
					value = opt.show === 'true'
				}
				let object = {}
				object['dev'] = {
					ingest: {
						testPattern: {
							enabled: value,
						},
					},
				}
				self.sendPatch(object)
			},
		}

		actions['set_test_pattern'] = {
			name: 'Set Test Pattern',
			options: [
				{
					type: 'dropdown',
					label: 'Select Pattern',
					id: 'pattern',
					default: 'white',
					choices: [
						{ id: 'black', label: 'Black' },
						{ id: 'red', label: 'Red' },
						{ id: 'green', label: 'Green' },
						{ id: 'blue', label: 'Blue' },
						{ id: 'white', label: 'White' },
						{ id: 'aspectRatioTest', label: 'Aspect Ratio Test' },
						{ id: 'colorBars', label: 'Color Bars' },
						{ id: 'diagonal', label: 'Diagonal' },
						{ id: 'diagonalColorBars', label: 'Diagonal Color Bars' },
						{ id: 'diagonalGradient', label: 'Diagonal Gradient' },
						{ id: 'grid', label: 'Grid' },
						{ id: 'horizontalGradient', label: 'Horizontal Gradient' },
						{ id: 'horizontalGraySteps', label: 'Horizontal Gray Steps' },
						{ id: 'smallGrid', label: 'Small Grid' },
						{ id: 'verticalGradient', label: 'Vertical Gradient' },
						{ id: 'verticalGraySteps', label: 'verticalGraySteps' },
					],
				},
				{
					type: 'dropdown',
					label: 'Moving Pattern',
					id: 'moving',
					default: 'false',
					choices: [
						{ id: 'true', label: 'Moving' },
						{ id: 'false', label: 'Static' },
					],
				},
				{
					type: 'colorpicker',
					label: 'Colour',
					id: 'color',
					default: combineRgb(255, 255, 255),
				},
			],
			callback: (event) => {
				let object = {}
				object['dev'] = {
					ingest: {
						testPattern: {
							type: event.options.pattern,
							motion: event.options.moving === 'true',
							color: event.options.color,
						},
					},
				}
				self.sendPatch(object)
			},
		}

		actions['set_preset'] = {
			name: 'Select Preset',
			options: [
				{
					type: 'textinput',
					label: 'Preset Nane',
					id: 'preset',
				},
			],
			callback: (event) => {
				let object = {}
				object['presetName'] = event.options.preset
				self.setPreset(object)
			},
		}

		actions['set_preset_select'] = {
			name: 'Select Preset Dropdown',
			options: [
				{
					type: 'dropdown',
					label: 'Preset Name',
					id: 'preset',
					default: '',
					choices: self.configurations,
				},
			],
			callback: (event) => {
				let object = {}
				object['presetName'] = event.options.preset
				self.setPreset(object)
			},
		}

		this.setActionDefinitions(actions)
	}

	initFeedback() {
		let self = this
		let feedbacks = {}

		feedbacks['blackout'] = {
			type: 'boolean',
			name: 'Check Blackout Status',
			description: 'Checks the blackout status of the processor.',
			defaultStyle: {
				color: combineRgb(0, 0, 0),
				bgcolor: combineRgb(255, 0, 0),
			},
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: 'true',
					choices: [
						{ id: 'true', label: 'Enabled' },
						{ id: 'false', label: 'Disabled' },
					],
				},
			],
			callback: function (feedback) {
				if (self.blackout === (feedback.options.state === 'true')) {
					return true
				} else {
					return false
				}
			},
		}

		feedbacks['freeze'] = {
			type: 'boolean',
			name: 'Check Freeze Status',
			description: 'Checks the freeze status of the processor.',
			style: {
				color: combineRgb(0, 0, 0),
				bgcolor: combineRgb(255, 0, 0),
			},
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: 'true',
					choices: [
						{ id: 'true', label: 'Enabled' },
						{ id: 'false', label: 'Disabled' },
					],
				},
			],
			callback: function (feedback) {
				if (self.freeze === (feedback.options.state === 'true')) {
					return true
				} else {
					return false
				}
			},
		}

		feedbacks['active_input'] = {
			type: 'boolean',
			name: 'Check Active Input',
			description: 'Returns true if the selected input is active.',
			style: {
				color: combineRgb(0, 255, 0),
				bgcolor: combineRgb(255, 255, 255),
			},
			options: [
				{
					type: 'dropdown',
					label: 'Input',
					id: 'input',
					default: '',
					choices: this.getInputsLabeled(),
				},
			],
			callback: function (feedback) {
				if (self.active_input === feedback.options.input) {
					return true
				} else {
					return false
				}
			},
		}

		feedbacks['invalid_input'] = {
			type: 'boolean',
			name: 'Check Invalid Input',
			description: 'Returns true if the selected input is invalid.',
			style: {
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(255, 70, 0),
			},
			options: [
				{
					type: 'dropdown',
					label: 'Input',
					id: 'input',
					default: '',
					choices: this.getInputsLabeled(),
				},
			],
			callback: function (feedback) {
				if (self.ingest !== undefined) {
					if (self.ingest.inputs[feedback.options.input] === undefined) {
						return true
					}
					return !self.ingest.inputs[feedback.options.input].valid
				}
			},
		}

		feedbacks['test_enabled'] = {
			type: 'boolean',
			name: 'Check Test Pattern Status',
			description: 'Checks if the test pattern is active.',
			style: {
				color: combineRgb(0, 0, 0),
				bgcolor: combineRgb(255, 0, 0),
			},
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: 'true',
					choices: [
						{ id: 'true', label: 'Enabled' },
						{ id: 'false', label: 'Disabled' },
					],
				},
			],
			callback: function (feedback) {
				if (self.test_enabled === (feedback.options.state === 'true')) {
					return true
				} else {
					return false
				}
			},
		}

		this.setFeedbackDefinitions(feedbacks)
	}

	initVariables() {
		let variables = [
			{
				name: 'Screen Brightness',
				variableId: 'screen_brightness',
			},
			{
				name: 'Screen Gamma',
				variableId: 'screen_gamma',
			},
			{
				name: 'Screen Color Temperature',
				variableId: 'screen_cct',
			},
			{
				name: 'Canvas Width',
				variableId: 'canvas_width',
			},
			{
				name: 'Canvas Height',
				variableId: 'canvas_height',
			},
			{
				name: 'Canvas X',
				variableId: 'canvas_x',
			},
			{
				name: 'Canvas Y',
				variableId: 'canvas_y',
			},
			{
				name: 'Tiles Count',
				variableId: 'tiles_count',
			},
			{
				name: 'Tiles Info',
				variableId: 'tiles_info',
			},
			{
				name: 'Test Pattern',
				variableId: 'test_pattern',
			},
			{
				name: 'Moving Test Pattern',
				variableId: 'test_pattern_moving',
			},
		]

		this.setVariableDefinitions(variables)
	}

	initPresets() {
		let presets = {}

		for (let input of this.getInputs()) {
			presets[input] = {
				type: 'button',
				category: 'Inputs',
				name: 'Switch Input',
				style: {
					text: input.toUpperCase(),
					size: '18',
					color: '16777215',
					bgcolor: combineRgb(0, 0, 0),
				},
				steps: [
					{
						down: [
							{
								actionId: 'set_input',
								options: {
									input: input,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'invalid_input',
						options: {
							input: input,
						},
						style: {
							color: combineRgb(255, 255, 255),
							bgcolor: combineRgb(255, 70, 0),
						},
					},
					{
						feedbackId: 'active_input',
						options: {
							input: input,
						},
						style: {
							color: combineRgb(255, 255, 255),
							bgcolor: combineRgb(0, 255, 0),
						},
					},
				],
			}
		}

		presets['blackout'] = {
			type: 'button',
			category: 'Utility',
			name: 'Blackout',
			style: {
				text: 'BO',
				size: '18',
				color: combineRgb(255, 0, 0),
				bgcolor: combineRgb(0, 0, 0),
			},
			steps: [
				{
					down: [
						{
							actionId: 'set_blackout',
							options: {
								bo: 'toggle',
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'blackout',
					options: {
						state: 'true',
					},
					style: {
						color: combineRgb(255, 255, 255),
						bgcolor: combineRgb(255, 0, 0),
					},
				},
			],
		}

		presets['freeze'] = {
			type: 'button',
			category: 'Utility',
			name: 'Freeze',
			style: {
				text: 'Freeze',
				size: '18',
				color: combineRgb(255, 0, 0),
				bgcolor: combineRgb(0, 0, 0),
			},
			steps: [
				{
					down: [
						{
							actionId: 'set_freeze',
							options: {
								freeze: 'toggle',
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'freeze',
					options: {
						state: 'true',
					},
					style: {
						color: combineRgb(255, 255, 255),
						bgcolor: combineRgb(255, 0, 0),
					},
				},
			],
		}

		presets['toggle_test'] = {
			type: 'button',
			category: 'Utility',
			name: 'Toggle test pattern',
			style: {
				text: 'Toggle test pattern',
				size: '14',
				color: combineRgb(255, 0, 0),
				bgcolor: combineRgb(0, 0, 0),
			},
			steps: [
				{
					down: [
						{
							actionId: 'set_show_test',
							options: {
								show: 'toggle',
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'test_enabled',
					options: {
						state: 'true',
					},
					style: {
						color: combineRgb(255, 255, 255),
						bgcolor: combineRgb(255, 0, 0),
					},
				},
			],
		}

		this.setPresetDefinitions(presets)
	}

	updateVariables(data, patch) {
		let self = this

		if (data.dev === undefined) {
			return
		}

		let ingest = data.dev.ingest
		if (ingest !== undefined) {
			if (!patch) {
				self.ingest = ingest
				self.checkFeedbacks('invalid_input')
			}

			if (ingest.input !== undefined) {
				self.active_input = ingest.input
				self.checkFeedbacks('active_input')
			}

			let inputs = ingest.inputs
			if (inputs !== undefined) {
				let inputArray = []
				Object.entries(inputs).forEach((entry) => {
					const [key, value] = entry
					inputArray.push(key)
				})
				this.inputs = inputArray
			}

			let testPattern = ingest.testPattern
			if (testPattern !== undefined) {
				if (testPattern.enabled !== undefined) {
					self.test_enabled = testPattern.enabled
					self.checkFeedbacks('test_enabled')
				}

				if (testPattern.type !== undefined) {
					self.setVariableValues({ test_pattern: testPattern.type })
				}

				if (testPattern.motion !== undefined) {
					self.setVariableValues({ test_pattern_moving: testPattern.motion })
				}
			}
		}

		let display = data.dev.display
		if (display !== undefined) {
			if (display.blackout !== undefined) {
				self.blackout = display.blackout
				self.checkFeedbacks('blackout')
			}

			if (display.freeze !== undefined) {
				self.freeze = display.freeze
				self.checkFeedbacks('freeze')
			}

			if (display.brightness !== undefined) {
				self.brightness = display.brightness
				self.setVariableValues({ screen_brightness: self.brightness })
			}

			if (display.gamma !== undefined) {
				self.gamma = display.gamma
				self.setVariableValues({ screen_gamma: self.gamma })
			}

			if (display.cct !== undefined) {
				self.cct = display.cct
				self.setVariableValues({ screen_cct: self.cct })
			}

			if (display.width !== undefined) {
				self.setVariableValues({ canvas_width: display.width })
			}

			if (display.height !== undefined) {
				self.setVariableValues({ canvas_height: display.height })
			}

			if (display.x !== undefined) {
				self.setVariableValues({ canvas_x: display.x })
			}

			if (display.y !== undefined) {
				self.setVariableValues({ canvas_y: display.y })
			}

			if (display.tilesCount !== undefined) {
				self.setVariableValues({ tiles_count: display.tilesCount })
			}

			if (display.tilesInfo !== undefined) {
				self.setVariableValues({ tiles_info: display.tilesInfo })
			}
		}
	}

	startPolling = function () {
		this.log('debug', 'start polling')
		let self = this

		if (self.timer === undefined) {
			self.timer = setInterval(self.poll.bind(self), pollIntervalMs)
		}

		self.poll()
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
				this.log('debug', 'error caught')
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
				this.log('debug', 'second error caught')
			})

		this.initActions()
		this.initPresets()
	}

	sendGetRequest(patch) {
		let self = this

		return new Promise(function (resolve, reject) {
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
				return reject()
			}

			// Call the api endpoint to get the state.
			const options = {
				method: 'GET',
				url: 'http://' + self.config.ip + patch,
				timeout: timeoutMs,
				headers: {
					'Content-type': 'application/json',
				},
			}

			request(options, function (err, result) {
				const response = self.handleResponse(timestamp, err, result)
				if (response === undefined) {
					return reject()
				} else {
					return resolve(response)
				}
			})
		})
	}

	sendPatch(data) {
		let self = this
		const timestamp = Date.now()

		let body = JSON.stringify(data)

		const options = {
			url: 'http://' + self.config.ip + '/api/v1/public',
			headers: {
				'Content-type': 'application/json',
			},
			body: body,
		}

		request.patch(options, function (err, result, body) {
			const response = self.handleResponse(timestamp, err, result)
			self.updateVariables(response, true)
		})
	}

	setPreset(data) {
		let self = this
		const timestamp = Date.now()

		let body = JSON.stringify(data)

		const options = {
			url: 'http://' + self.config.ip + '/api/v1/presets/apply',
			headers: {
				'Content-type': 'application/json',
			},
			body: body,
		}

		request.post(options, function (err, result, body) {
			const response = self.handleResponse(timestamp, err, result)
			self.updateVariables(response, true)
		})
	}

	handleResponse(timestamp, err, result) {
		const self = this

		// If the request is old it should be ignored.
		if (timestamp < self.timestampOfRequest) {
			return
		}

		self.timestampOfRequest = timestamp

		// Check if request was unsuccessful.
		if (err !== null || result.statusCode !== 200) {
			if (self.loggedError === false) {
				let msg = 'HTTP GET Request for ' + self.config.ip + ' failed'
				if (err !== null) {
					msg += ' (' + err + ')'
				} else {
					msg += ' (' + result.statusCode + ': ' + result.body + ')'
				}

				self.log('error', msg)
				self.updateStatus(InstanceStatus.ConnectionFailure, msg)
				self.loggedError = true
			}
			return
		}

		// Made a successful request.
		if (self.loggedError === true || self.firstAttempt) {
			self.log('info', 'HTTP connection succeeded')
			self.updateStatus(InstanceStatus.Ok)
			self.loggedError = false
			self.firstAttempt = false
		}

		let response = {}
		if (result.body.length > 0) {
			try {
				response = JSON.parse(result.body.toString())
			} catch (error) {
				return
			}
		}
		return response
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
}

runEntrypoint(instance, [])
