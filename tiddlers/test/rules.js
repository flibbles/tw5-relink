/*\

Tests rules and all its idiosyncracies.

\*/

describe('rules', function() {

var utils = require("test/utils");

beforeEach(function() {
	spyOn(console, 'log');
});

function getText(wiki, title) {
	return wiki.getTiddler(title).fields.text;
};

function reportText(wiki, title) {
	return wiki.getTiddlerRelinkReferences(title);
};

it('nested macro arguments', function() {
	// Turns out nested wikitext in macro parameters doesn't obey \rules
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: 'yeslinks', text: '<<macro text:"[[from]]">>\n[[from]]'},
		{title: 'nolinks',  text: '\\rules except prettylink\n<<macro text:"[[from]]">>\n[[from]]'},
		utils.macroConf('macro', 'text', 'wikitext')
	]);

	expect(reportText(wiki, 'yeslinks')).toEqual({from: ['<<macro text: "[[from]]">>', '[[from]]']});
	expect(reportText(wiki, 'nolinks')).toEqual({from: ['<<macro text: "[[from]]">>']});

	wiki.renameTiddler('from', 'to');
	expect(getText(wiki, 'yeslinks')).toBe('<<macro text:"[[to]]">>\n[[to]]');
	expect(getText(wiki, 'nolinks')).toBe('\\rules except prettylink\n<<macro text:"[[to]]">>\n[[from]]');
});

it('nested widget arguments', function() {
	// $<list filter="" emptyMessage="" /> is one of those real-life cases
	// that reveals how widget attributes don't follow /rules pragma
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: 'yeslinks', text: '<$list filter="" emptyMessage="[[from]]"/>\n[[from]]'},
		{title: 'nolinks',  text: '\\rules except prettylink\n<$list filter="" emptyMessage="[[from]]"/>\n[[from]]'},
		utils.attrConf('$list', 'emptyMessage', 'wikitext')
	]);

	expect(reportText(wiki, 'yeslinks')).toEqual({from: ['<$list emptyMessage="[[from]]" />', '[[from]]']});
	expect(reportText(wiki, 'nolinks')).toEqual({from: ['<$list emptyMessage="[[from]]" />']});

	wiki.renameTiddler('from', 'to');
	expect(getText(wiki, 'yeslinks')).toBe('<$list filter="" emptyMessage="[[to]]"/>\n[[to]]');
	expect(getText(wiki, 'nolinks')).toBe('\\rules except prettylink\n<$list filter="" emptyMessage="[[to]]"/>\n[[from]]');
});

});
