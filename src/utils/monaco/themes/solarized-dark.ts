const base03 = '002b36';
const base02 = '073642';
const base01 = '586e75';
const base00 = '657b83';
const base0 = '839496';
const base1 = '93a1a1';
const base2 = 'eee8d5';
const base3 = 'fdf6e3';
const yellow = 'b58900';
const orange = 'cb4b16';
const red = 'dc322f';
const magenta = 'd33682';
const violet = '6c71c4';
const blue = '268bd2';
const cyan = '2aa198';
const green = '859900';

const SolarizedTheme: monaco.editor.IStandaloneThemeData = {
	base: 'vs-dark',
	inherit: true,
	colors: {
		'editor.foreground': `#${base3}`,
		'editor.background': `#${base03}`,
		'editor.lineHighlightBackground': `#${base02}`
	},
	rules: [{
		token: '',
		foreground: base3
	}, {
		token: 'comment',
		foreground: base00,
		background: green,
		fontStyle: 'italic'
	}, {
		token: 'string',
		foreground: cyan
	}, {
		token: 'string.regexp',
		foreground: magenta
	}, {
		token: 'constant.numeric',
		foreground: magenta
	}, {
		token: 'variable',
		foreground: blue
	}, {
		token: 'keyword',
		foreground: green
	}, {
		token: 'storage',
		foreground: base1,
		fontStyle: 'bold'
	}, {
		token: 'entity.name.class',
		foreground: orange
	}, {
		token: 'entity.name.type',
		foreground: orange
	}, {
		token: 'entity.name.function',
		foreground: blue
	}, {
		token: 'punctuation.definition.variable',
		foreground: green
	}, {
		token: 'punctuation.section.embedded.begin',
		foreground: red
	}, {
		token: 'punctuation.section.embedded.end',
		foreground: red
	}, {
		token: 'constant.language',
		foreground: yellow
	}, {
		token: 'meta.preprocessor',
		foreground: yellow
	}, {
		token: 'support.function.construct',
		foreground: orange
	}, {
		token: 'keyword.other.new',
		foreground: orange
	}, {
		token: 'constant.character',
		foreground: orange
	}, {
		token: 'constant.other',
		foreground: orange
	}, {
		token: 'entity.other.inherited-class',
		foreground: violet
	}, {
		token: 'variable.parameter'
	}, {
		token: 'entity.name.tag',
		foreground: blue
	}, {
		token: 'variable.parameter.handlebars',
		foreground: base2
	}, {
		token: 'identifier',
		foreground: blue
	}, {
		token: 'attribute.name',
		foreground: base0
	}, {
		token: 'attribute.value',
		foreground: cyan
	}, {
		token: 'delimiter.html',
		foreground: base01
	}, {
		token: 'tag',
		foreground: blue
	}]
}

export default SolarizedTheme;
