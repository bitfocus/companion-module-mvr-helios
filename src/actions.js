const { combineRgb } = require('@companion-module/base')
exports.updateActions = function () {
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
			self.sendPatchRequest(object)
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
			self.sendPatchRequest(object)
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
			self.sendPatchRequest(object)
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
			self.sendPatchRequest(object)
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
			self.sendPatchRequest(object)
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
			self.sendPatchRequest(object)
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
			self.sendPatchRequest(object)
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
			self.sendPatchRequest(object)
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
			self.sendPatchRequest(object)
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
			self.sendPatchRequest(object)
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