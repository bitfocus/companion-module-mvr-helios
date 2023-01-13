const { combineRgb } = require('@companion-module/base')
exports.updatePresets = function () {
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
