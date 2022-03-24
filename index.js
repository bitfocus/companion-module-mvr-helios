const instance_skel = require('../../instance_skel')
const request = require('request')

// Constants
const pollIntervalMs = 1000
const timeoutMs = 2000

class instance extends instance_skel {
	constructor(system, id, config) {
		super(system, id, config)
		let self = this

		// Variables
		self.timer = undefined
		self.loggedError = false // Stops the poll flooding the log
		self.firstAttempt = true
		self.timestampOfRequest = Date.now()

		self.initActions()
		self.initFeedback()
		self.initPresets()

		self.status(self.STATUS_UNKNOWN, '')
	}

	config_fields() {
		let self = this

		return [
			{
				type: 'text',
				id: 'info',
				width: 12,
				label: 'Information',
				value: 'This works with all Helios models.',
			},
			{
				type: 'text',
				id: 'info',
				width: 12,
				label: 'Firmware',
				value: 'Latest supported firmware version: HELIOS v21.08.1.21311',
			},
			{
				type: 'textinput',
				id: 'ip',
				label: 'Target IP',
				width: 6,
				regex: self.REGEX_IP,
			},
		]
	}

	init() {
		let self = this

		self.initVariables()
		self.startPolling()
	}

	destroy() {
		let self = this

		self.stopPolling()
		self.debug('destroy', self.id)
	}

	initActions() {
		let self = this
		let actions = {}

		actions['set_blackout'] = {
			label: 'Blackout',
			options: [
				{
					type: 'dropdown',
					label: 'Select State',
					id: 'bo',
					default: 'toggle',
					choices: [
						{ id: 'true', label: 'True' },
						{ id: 'false', label: 'False' },
						{ id: 'toggle', label: 'Toggle' },
					],
				},
			],
			callback: (action, bank) => {
				let opt = action.options
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
			label: 'Freeze',
			options: [
				{
					type: 'dropdown',
					label: 'Select State',
					id: 'freeze',
					default: 'toggle',
					choices: [
						{ id: 'true', label: 'True' },
						{ id: 'false', label: 'False' },
						{ id: 'toggle', label: 'Toggle' },
					],
				},
			],
			callback: (action, bank) => {
				let opt = action.options
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
			label: 'Input',
			options: [
				{
					type: 'dropdown',
					label: 'Select Input',
					id: 'input',
					default: 'hdmi1',
					choices: [
						{ id: 'hdmi', label: 'HDMI' },
						{ id: 'hdmi1', label: 'HDMI1' },
						{ id: 'hdmi2', label: 'HDMI2' },
						{ id: 'hdmi1X2', label: 'HDMI(1X2)' },
						{ id: 'hdmi2X1', label: 'HDMI(2X1)' },
						{ id: 'dp', label: 'DP' },
						{ id: 'dp1', label: 'DP1' },
						{ id: 'dp2', label: 'DP2' },
						{ id: 'dp1X2', label: 'DP(1X2)' },
						{ id: 'dp2X1', label: 'DP(2X1)' },
						{ id: 'sdi1', label: 'SDI1' },
						{ id: 'sdi2', label: 'SDI2' },
						{ id: 'sdi3', label: 'SDI3' },
						{ id: 'sdi4', label: 'SDI4' },
						{ id: 'sdi1X2', label: 'SDI(1X2)' },
						{ id: 'sdi1X3', label: 'SDI(1X3)' },
						{ id: 'sdi1X4', label: 'SDI(1X4)' },
						{ id: 'sdi2X1', label: 'SDI(2X1)' },
						{ id: 'sdi2X2', label: 'SDI(2X2)' },
						{ id: 'sdi3X1', label: 'SDI(3X1)' },
						{ id: 'sdi4X1', label: 'SDI(4X1)' },
					],
				},
			],
			callback: (action, bank) => {
				let object = {}
				object['dev'] = {
					ingest: {
						input: action.options.input,
					},
				}
				self.sendPatch(object)
			},
		}

		actions['set_brightness'] = {
			label: 'Screen Brightness',
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
			callback: (action, bank) => {
				let object = {}
				object['dev'] = {
					display: {
						brightness: action.options.brightness,
					},
				}
				self.sendPatch(object)
			},
		}

		actions['set_gamma'] = {
			label: 'Screen Gamma',
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
			callback: (action, bank) => {
				let object = {}
				object['dev'] = {
					display: {
						gamma: action.options.gamma,
					},
				}
				self.sendPatch(object)
			},
		}

		actions['set_cct'] = {
			label: 'Screen Color Temperature',
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
			callback: (action, bank) => {
				let object = {}
				object['dev'] = {
					display: {
						cct: action.options.temp,
					},
				}
				self.sendPatch(object)
			},
		}

		actions['set_resolution'] = {
			label: 'Canvas Resolution',
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
			callback: (action, bank) => {
				let object = {}
				object['dev'] = {
					display: {
						width: action.options.width,
						height: action.options.height,
					},
				}
				self.sendPatch(object)
			},
		}

		actions['set_position'] = {
			label: 'Canvas Position',
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
			callback: (action, bank) => {
				let object = {}
				object['dev'] = {
					display: {
						x: action.options.x,
						y: action.options.y,
					},
				}
				self.sendPatch(object)
			},
		}

		actions['set_show_test'] = {
			label: 'Show Test Pattern',
			options: [
				{
					type: 'dropdown',
					label: 'Select State',
					id: 'show',
					default: 'toggle',
					choices: [
						{ id: 'true', label: 'True' },
						{ id: 'false', label: 'False' },
						{ id: 'toggle', label: 'Toggle' },
					],
				},
			],
			callback: (action, bank) => {
				let opt = action.options
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
			label: 'Set Test Pattern',
			options: [
				{
					type: 'dropdown',
					label: 'Select Pattern',
					id: 'pattern',
					default: 'green',
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
						{ id: 'true', label: 'True' },
						{ id: 'false', label: 'False' },
					],
				},
			],
			callback: (action, bank) => {
				let object = {}
				object['dev'] = {
					ingest: {
						testPattern: {
							type: action.options.pattern,
							motion: action.options.moving === 'true',
						},
					},
				}
				self.sendPatch(object)
			},
		}

		actions['set_preset'] = {
			label: 'Select Preset',
			options: [
				{
					type: 'textinput',
					label: 'Preset Nane',
					id: 'preset',
				},
			],
			callback: (action, bank) => {
				let object = {}
				object['presetName'] = action.options.preset
				self.setPreset(object)
			},
		}

		self.setActions(actions)
	}

	initFeedback() {
		let self = this
		let feedbacks = {}

		feedbacks['blackout'] = {
			type: 'boolean',
			label: 'Check Blackout Status',
			description: 'Longer description of the feedback',
			style: {
				color: self.rgb(0, 0, 0),
				bgcolor: self.rgb(255, 0, 0),
			},
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: 'true',
					choices: [
						{ id: 'true', label: 'True' },
						{ id: 'true', label: 'False' },
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
			label: 'Check Freeze Status',
			description: 'Longer description of the feedback',
			style: {
				color: self.rgb(0, 0, 0),
				bgcolor: self.rgb(255, 0, 0),
			},
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: 'true',
					choices: [
						{ id: 'true', label: 'True' },
						{ id: 'true', label: 'False' },
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
			label: 'Check Active Input',
			description: 'Longer description of the feedback',
			style: {
				color: self.rgb(0, 255, 0),
				bgcolor: self.rgb(255, 255, 255),
			},
			options: [
				{
					type: 'dropdown',
					label: 'Input',
					id: 'input',
					default: 'hdmi1',
					choices: [
						{ id: 'hdmi', label: 'HDMI' },
						{ id: 'hdmi1', label: 'HDMI1' },
						{ id: 'hdmi2', label: 'HDMI2' },
						{ id: 'hdmi1X2', label: 'HDMI(1X2)' },
						{ id: 'hdmi2X1', label: 'HDMI(2X1)' },
						{ id: 'dp', label: 'DP' },
						{ id: 'dp1', label: 'DP1' },
						{ id: 'dp2', label: 'DP2' },
						{ id: 'dp1X2', label: 'DP(1X2)' },
						{ id: 'dp2X1', label: 'DP(2X1)' },
						{ id: 'sdi1', label: 'SDI1' },
						{ id: 'sdi2', label: 'SDI2' },
						{ id: 'sdi3', label: 'SDI3' },
						{ id: 'sdi4', label: 'SDI4' },
						{ id: 'sdi1X2', label: 'SDI(1X2)' },
						{ id: 'sdi1X3', label: 'SDI(1X3)' },
						{ id: 'sdi1X4', label: 'SDI(1X4)' },
						{ id: 'sdi2X1', label: 'SDI(2X1)' },
						{ id: 'sdi2X2', label: 'SDI(2X2)' },
						{ id: 'sdi3X1', label: 'SDI(3X1)' },
						{ id: 'sdi4X1', label: 'SDI(4X1)' },
					],
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
			label: 'Check Invalid Input',
			description: 'Returns true if the input is invalid',
			style: {
				color: self.rgb(255, 255, 255),
				bgcolor: self.rgb(255, 70, 0),
			},
			options: [
				{
					type: 'dropdown',
					label: 'Input',
					id: 'input',
					default: 'hdmi1',
					choices: [
						{ id: 'hdmi', label: 'HDMI' },
						{ id: 'hdmi1', label: 'HDMI1' },
						{ id: 'hdmi2', label: 'HDMI2' },
						{ id: 'hdmi1X2', label: 'HDMI(1X2)' },
						{ id: 'hdmi2X1', label: 'HDMI(2X1)' },
						{ id: 'dp', label: 'DP' },
						{ id: 'dp1', label: 'DP1' },
						{ id: 'dp2', label: 'DP2' },
						{ id: 'dp1X2', label: 'DP(1X2)' },
						{ id: 'dp2X1', label: 'DP(2X1)' },
						{ id: 'sdi1', label: 'SDI1' },
						{ id: 'sdi2', label: 'SDI2' },
						{ id: 'sdi3', label: 'SDI3' },
						{ id: 'sdi4', label: 'SDI4' },
						{ id: 'sdi1X2', label: 'SDI(1X2)' },
						{ id: 'sdi1X3', label: 'SDI(1X3)' },
						{ id: 'sdi1X4', label: 'SDI(1X4)' },
						{ id: 'sdi2X1', label: 'SDI(2X1)' },
						{ id: 'sdi2X2', label: 'SDI(2X2)' },
						{ id: 'sdi3X1', label: 'SDI(3X1)' },
						{ id: 'sdi4X1', label: 'SDI(4X1)' },
					],
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
			label: 'Check Test Pattern Status',
			description: 'Longer description of the feedback',
			style: {
				color: self.rgb(0, 0, 0),
				bgcolor: self.rgb(255, 0, 0),
			},
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: 'true',
					choices: [
						{ id: 'true', label: 'True' },
						{ id: 'true', label: 'False' },
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

		self.setFeedbackDefinitions(feedbacks)
	}

	initVariables() {
		let self = this

		let variables = []
		variables.push({
			label: 'Screen Brightness',
			name: 'screen_brightness',
		})

		variables.push({
			label: 'Screen Gamma',
			name: 'screen_gamma',
		})

		variables.push({
			label: 'Screen Color Temperature',
			name: 'screen_cct',
		})

		variables.push({
			label: 'Canvas Width',
			name: 'canvas_width',
		})

		variables.push({
			label: 'Canvas Height',
			name: 'canvas_height',
		})

		variables.push({
			label: 'Canvas X',
			name: 'canvas_x',
		})

		variables.push({
			label: 'Canvas Y',
			name: 'canvas_y',
		})

		variables.push({
			label: 'Tiles Count',
			name: 'tiles_count',
		})

		variables.push({
			label: 'Tiles Info',
			name: 'tiles_info',
		})

		variables.push({
			label: 'Test Pattern',
			name: 'test_pattern',
		})

		variables.push({
			label: 'Moving Test Pattern',
			name: 'test_pattern_moving',
		})

		self.setVariable('screen_brightness', 100)
		self.setVariable('screen_gamma', 2.4)
		self.setVariable('screen_cct', 6504)
		self.setVariable('canvas_width', 1920)
		self.setVariable('canvas_height', 1080)
		self.setVariable('canvas_x', 0)
		self.setVariable('canvas_y', 0)
		self.setVariable('tiles_count', 0)
		self.setVariable('tiles_info', '')
		self.setVariable('test_pattern', '')
		self.setVariable('test_pattern_moving', '')

		self.setVariableDefinitions(variables)
	}

	initPresets() {
		let self = this
		let presets = []

		const inputs_list = [
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

		for (let input of inputs_list) {
			presets.push({
				category: 'Inputs',
				label: 'Switch Input',
				bank: {
					style: 'text',
					text: input.toUpperCase(),
					size: '18',
					color: '16777215',
					bgcolor: self.rgb(0, 0, 0),
				},
				actions: [
					{
						action: 'set_input',
						options: {
							input: input,
						},
					},
				],
				feedbacks: [
					{
						type: 'invalid_input',
						options: {
							input: input,
						},
						style: {
							bgcolor: self.rgb(255, 70, 0),
							color: self.rgb(255, 255, 255),
						},
					},
					{
						type: 'active_input',
						options: {
							input: input,
						},
						style: {
							bgcolor: self.rgb(0, 255, 0),
							color: self.rgb(255, 255, 255),
						},
					},
				],
			})
		}

		presets.push({
			category: 'Utility',
			label: 'Blackout',
			bank: {
				style: 'text',
				text: 'BO',
				size: '18',
				color: self.rgb(255, 0, 0),
				bgcolor: self.rgb(0, 0, 0),
			},
			actions: [
				{
					action: 'set_blackout',
					options: {
						bo: 'toggle',
					},
				},
			],
			feedbacks: [
				{
					type: 'blackout',
					options: {
						id: 'true',
					},
					style: {
						bgcolor: self.rgb(255, 0, 0),
						color: self.rgb(255, 255, 255),
					},
				},
			],
		})

		presets.push({
			category: 'Utility',
			label: 'Freeze',
			bank: {
				style: 'text',
				text: 'Freeze',
				size: '18',
				color: self.rgb(255, 0, 0),
				bgcolor: self.rgb(0, 0, 0),
			},
			actions: [
				{
					action: 'set_freeze',
					options: {
						freeze: 'toggle',
					},
				},
			],
			feedbacks: [
				{
					type: 'freeze',
					options: {
						id: 'true',
					},
					style: {
						bgcolor: self.rgb(255, 0, 0),
						color: self.rgb(255, 255, 255),
					},
				},
			],
		})

		presets.push({
			category: 'Utility',
			label: 'Toggle test pattern',
			bank: {
				style: 'text',
				text: 'Toggle test pattern',
				size: '14',
				color: self.rgb(255, 0, 0),
				bgcolor: self.rgb(0, 0, 0),
			},
			actions: [
				{
					action: 'set_show_test',
					options: {
						freeze: 'toggle',
					},
				},
			],
			feedbacks: [
				{
					type: 'test_enabled',
					options: {
						id: 'true',
					},
					style: {
						bgcolor: self.rgb(255, 0, 0),
						color: self.rgb(255, 255, 255),
					},
				},
			],
		})

		self.setPresetDefinitions(presets)
	}

	updateConfig(config) {
		let self = this

		self.config = config
		self.startPolling()
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

			let testPattern = ingest.testPattern
			if (testPattern !== undefined) {
				if (testPattern.enabled !== undefined) {
					self.test_enabled = testPattern.enabled
					self.checkFeedbacks('test_enabled')
				}

				if (testPattern.type !== undefined) {
					self.setVariable('test_pattern', testPattern.type)
				}

				if (testPattern.motion !== undefined) {
					self.setVariable('test_pattern_moving', testPattern.motion)
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
				self.setVariable('screen_brightness', self.brightness)
			}

			if (display.gamma !== undefined) {
				self.gamma = display.gamma
				self.setVariable('screen_gamma', self.gamma)
			}

			if (display.cct !== undefined) {
				self.cct = display.cct
				self.setVariable('screen_cct', self.cct)
			}

			if (display.width !== undefined) {
				self.setVariable('canvas_width', display.width)
			}

			if (display.height !== undefined) {
				self.setVariable('canvas_height', display.height)
			}

			if (display.x !== undefined) {
				self.setVariable('canvas_x', display.x)
			}

			if (display.y !== undefined) {
				self.setVariable('canvas_y', display.y)
			}

			if (display.tilesCount !== undefined) {
				self.setVariable('tiles_count', display.tilesCount)
			}

			if (display.tilesInfo !== undefined) {
				self.setVariable('tiles_info', display.tilesInfo)
			}
		}
	}

	startPolling = function () {
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

	poll() {
		let self = this
		const timestamp = Date.now()

		// Check if the IP was set.
		if (self.config.ip === undefined || self.config.ip.length === 0) {
			if (self.loggedError === false) {
				let msg = 'IP is not set'
				self.log('error', msg)
				self.status(self.STATUS_WARNING, msg)
				self.loggedError = true
			}

			self.timestampOfRequest = timestamp
			return
		}

		// Call the api endpoint to get the state.
		const options = {
			method: 'GET',
			url: 'http://' + self.config.ip + '/api/v1/public',
			timeout: timeoutMs,
			headers: {
				'Content-type': 'application/json',
			},
		}

		request(options, function (err, result) {
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
					self.status(self.STATUS_ERROR, msg)
					self.loggedError = true
				}
				return
			}

			// Made a successful request.
			if (self.loggedError === true || self.firstAttempt) {
				self.log('info', 'HTTP connection succeeded')
				self.status(self.STATUS_OK)
				self.loggedError = false
				self.firstAttempt = false
			}

			let response = {}
			if (result.body.length > 0) {
				try {
					response = JSON.parse(result.body.toString())
				} catch (error) {}
			}

			self.updateVariables(response, false)
		})
	}

	sendPatch(data) {
		let self = this
		const timestamp = Date.now()

		let body = JSON.stringify(data)

		const options = {
			url: 'http://' + this.config.host + '/api/v1/public',
			headers: {
				'Content-type': 'application/json',
			},
			body: body,
		}

		request.patch(options, function (err, result, body) {
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
					self.status(self.STATUS_ERROR, msg)
					self.loggedError = true
				}
				return
			}

			// Made a successful request.
			if (self.loggedError === true || self.firstAttempt) {
				self.log('info', 'HTTP connection succeeded')
				self.status(self.STATUS_OK)
				self.loggedError = false
				self.firstAttempt = false
			}

			let response = {}
			if (result.body.length > 0) {
				try {
					response = JSON.parse(result.body.toString())
				} catch (error) {}
			}
			self.updateVariables(response, true)
		})
	}

	setPreset(data) {
		let self = this
		const timestamp = Date.now()

		let body = JSON.stringify(data)

		const options = {
			url: 'http://' + this.config.host + '/api/v1/presets/apply',
			headers: {
				'Content-type': 'application/json',
			},
			body: body,
		}

		request.post(options, function (err, result, body) {
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
					self.status(self.STATUS_ERROR, msg)
					self.loggedError = true
				}
				return
			}

			// Made a successful request.
			if (self.loggedError === true || self.firstAttempt) {
				self.log('info', 'HTTP connection succeeded')
				self.status(self.STATUS_OK)
				self.loggedError = false
				self.firstAttempt = false
			}

			let response = {}
			if (result.body.length > 0) {
				try {
					response = JSON.parse(result.body.toString())
				} catch (error) {}
			}
			self.updateVariables(response, true)
		})
	}
}

exports = module.exports = instance
