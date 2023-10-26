exports.initVariables = function () {
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
			name: 'Screen Duv',
			variableId: 'screen_duv',
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
		{
			name: 'Redundancy Info',
			variableId: 'redundancy_info',
		},
		{
			name: 'Redundancy Mode',
			variableId: 'redundancy_mode',
		},
		{
			name: 'Redundancy Role',
			variableId: 'redundancy_role',
		},
		{
			name: 'Redundancy State',
			variableId: 'redundancy_state',
		},
	]

	this.setVariableDefinitions(variables)
}

exports.updateVariables = function (data, patch) {
	let self = this

	if (data === undefined || data.dev === undefined) {
		return
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

		if (display.cctDuv !== undefined) {
			self.duv = display.cctDuv
			self.setVariableValues({ screen_duv: self.duv })
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

		let redundancy = display.redundancy
		if (redundancy !== undefined) {
			self.setVariableValues({
				redundancy_info: redundancy.info,
				redundancy_mode: redundancy.mode,
				redundancy_role: redundancy.role,
				redundancy_state: redundancy.state,
			})
		}
	}

	let groups = data.dev.groups
	if (groups !== undefined) {
		self.groups = Object.keys(groups).map((key) => groups[key])
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
				const [key] = entry
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
}
