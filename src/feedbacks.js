const { combineRgb } = require('@companion-module/base')
exports.initFeedback = function () {
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
			return self.blackout === (feedback.options.state === 'true');
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
			return self.freeze === (feedback.options.state === 'true');
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
			return self.active_input === feedback.options.input;
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
			return self.test_enabled === (feedback.options.state === 'true');
		},
	}

	this.setFeedbackDefinitions(feedbacks)
}