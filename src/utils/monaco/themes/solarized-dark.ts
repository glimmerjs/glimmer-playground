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

const SolarizedTheme: monaco.editor.ITheme = {
  base: 'vs-dark',
  inherit: true,
  rules: [{
    token: '',
    foreground: base3
  },

    {
      token: 'comment',
      foreground: base00,
      background: green,
      fontStyle: 'italic'
    },
    {
      token: 'string',
      foreground: cyan
    },
    {
      token: 'string.regexp',
      foreground: magenta
    },
    {
			token: 'constant.numeric',
      foreground: magenta
		},
    {
      token: 'variable',
      foreground: blue
    },
    {
      token: 'keyword',
      foreground: green
    },
    {
      token: 'storage',
      foreground: base1,
      fontStyle: 'bold'
    },
    {
      token: 'entity.name.class',
      foreground: orange
    },
    {
      token: 'entity.name.type',
      foreground: orange
    },
    {
      token: 'entity.name.function',
      foreground: blue
    },
    {
      token: 'punctuation.definition.variable',
      foreground: green
    },
    {
      token: 'punctuation.section.embedded.begin',
      foreground: red
    },
    {
      token: 'punctuation.section.embedded.end',
      foreground: red
    },
    {
      token: 'constant.language',
      foreground: yellow
    },
    {
      token: 'meta.preprocessor',
      foreground: yellow
    },
    {
      token: 'support.function.construct',
      foreground: orange
    },
    {
      token: 'keyword.other.new',
      foreground: orange
    },
    {
      token: 'constant.character',
      foreground: orange
    },
    {
      token: 'constant.other',
      foreground: orange
    },
    {
      token: 'entity.other.inherited-class',
      foreground: violet
    },
    {
      token: 'variable.parameter'
    },
    {
      token: 'entity.name.tag',
      foreground: blue
    },
    {
      token: 'variable.parameter.handlebars',
      foreground: blue
    },
    {
      token: 'identifier',
      foreground: blue
    },
    {
      token: 'attribute.name',
      foreground: base0
    }
	// 	{
	// 		"name": "Function argument",
	// 		"scope": "variable.parameter",
	// 		"settings": {}
	// 	},
	// 	{
	// 		"name": "Tag name",
	// 		"scope": "entity.name.tag",
	// 		"settings": {
	// 			"foreground": blue
	// 		}
	// 	},
	// 	{
	// 		"name": "Tag start/end",
	// 		"scope": "punctuation.definition.tag",
	// 		"settings": {
	// 			"foreground": "#657B83"
	// 		}
	// 	},
	// 	{
	// 		"name": "Tag attribute",
	// 		"scope": "entity.other.attribute-name",
	// 		"settings": {
	// 			"foreground": base1
	// 		}
	// 	},
	// 	{
	// 		"name": "Library function",
	// 		"scope": "support.function",
	// 		"settings": {
	// 			"foreground": blue
	// 		}
	// 	},
	// 	{
	// 		"name": "Continuation",
	// 		"scope": "punctuation.separator.continuation",
	// 		"settings": {
	// 			"foreground": "#D30102"
	// 		}
	// 	},
	// 	{
	// 		"name": "Library constant",
	// 		"scope": "support.constant",
	// 		"settings": {}
	// 	},
	// 	{
	// 		"name": "Library class/type",
	// 		"scope": [
	// 			"support.type",
	// 			"support.class"
	// 		],
	// 		"settings": {
	// 			"foreground": green
	// 		}
	// 	},
	// 	{
	// 		"name": "Library Exception",
	// 		"scope": "support.type.exception",
	// 		"settings": {
	// 			"foreground": orange
	// 		}
	// 	},
	// 	{
	// 		"name": "Library variable",
	// 		"scope": "support.other.variable",
	// 		"settings": {}
	// 	},
	// 	{
	// 		"name": "Invalid",
	// 		"scope": "invalid",
	// 		"settings": {}
	// 	},
	// 	{
	// 		"name": "diff: header",
	// 		"scope": [
	// 			"meta.diff",
	// 			"meta.diff.header"
	// 		],
	// 		"settings": {
	// 			"background": yellow,
	// 			"fontStyle": "italic",
	// 			"foreground": "#E0EDDD"
	// 		}
	// 	},
	// 	{
	// 		"name": "diff: deleted",
	// 		"scope": "markup.deleted",
	// 		"settings": {
	// 			"background": "#eee8d5",
	// 			"fontStyle": "",
	// 			"foreground": "#dc322f"
	// 		}
	// 	},
	// 	{
	// 		"name": "diff: changed",
	// 		"scope": "markup.changed",
	// 		"settings": {
	// 			"background": "#eee8d5",
	// 			"fontStyle": "",
	// 			"foreground": orange
	// 		}
	// 	},
	// 	{
	// 		"name": "diff: inserted",
	// 		"scope": "markup.inserted",
	// 		"settings": {
	// 			"background": "#eee8d5",
	// 			"foreground": "#219186"
	// 		}
	// 	},
	// 	{
	// 		"name": "Markup Quote",
	// 		"scope": "markup.quote",
	// 		"settings": {
	// 			"foreground": green
	// 		}
	// 	},
	// 	{
	// 		"name": "Markup Lists",
	// 		"scope": "markup.list",
	// 		"settings": {
	// 			"foreground": yellow
	// 		}
	// 	},
	// 	{
	// 		"name": "Markup Styling",
	// 		"scope": [
	// 			"markup.bold",
	// 			"markup.italic"
	// 		],
	// 		"settings": {
	// 			"foreground": "#D33682"
	// 		}
	// 	},
	// 	{
	// 		"name": "Markup Inline",
	// 		"scope": "markup.inline.raw",
	// 		"settings": {
	// 			"fontStyle": "",
	// 			"foreground": "#2AA198"
	// 		}
	// 	},
	// 	{
	// 		"name": "Markup Headings",
	// 		"scope": "markup.heading",
	// 		"settings": {
	// 			"foreground": blue
	// 		}
	// 	},
	// 	{
	// 		"name": "Markup Setext Header",
	// 		"scope": "markup.heading.setext",
	// 		"settings": {
	// 			"fontStyle": "",
	// 			"foreground": blue
	// 		}
	// 	}
	// ],
  ]
}

export default SolarizedTheme;
