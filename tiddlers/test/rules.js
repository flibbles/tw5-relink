/*\

Tests rules and all its idiosyncracies.

\*/

describe('rules', function() {

var utils = require("./utils");

beforeEach(function() {
	spyOn(console, 'log');
});

function getText(wiki, title) {
	return wiki.getTiddler(title).fields.text;
};

it('prettylinks nested as macro arguments', function() {
	// Turns out nested wikitext in macro parameters doesn't obey \rules
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: 'yeslinks', text: '<<macro text:"[[from]]">>\n[[from]]'},
		{title: 'nolinks',  text: '\\rules except prettylink\n<<macro text:"[[from]]">>\n[[from]]'},
		utils.macroConf('macro', 'text', 'wikitext')
	]);

	expect(utils.getReport('yeslinks', wiki)).toEqual({from: ['<<macro text: "[[from]]">>', '[[from]]']});
	expect(utils.getReport('nolinks', wiki)).toEqual({from: ['<<macro text: "[[from]]">>']});

	wiki.renameTiddler('from', 'to');
	expect(getText(wiki, 'yeslinks')).toBe('<<macro text:"[[to]]">>\n[[to]]');
	expect(getText(wiki, 'nolinks')).toBe('\\rules except prettylink\n<<macro text:"[[to]]">>\n[[from]]');
});

it('prettylinks nested as widget arguments', function() {
	// $<list filter="" emptyMessage="" /> is one of those real-life cases
	// that reveals how widget attributes don't follow /rules pragma
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: 'yeslinks', text: '<$list filter="" emptyMessage="[[from]]"/>\n[[from]]'},
		{title: 'nolinks',  text: '\\rules except prettylink\n<$list filter="" emptyMessage="[[from]]"/>\n[[from]]'},
		utils.attrConf('$list', 'emptyMessage', 'wikitext')
	]);

	expect(utils.getReport('yeslinks', wiki)).toEqual({from: ['<$list emptyMessage="[[from]]" />', '[[from]]']});
	expect(utils.getReport('nolinks', wiki)).toEqual({from: ['<$list emptyMessage="[[from]]" />']});

	wiki.renameTiddler('from', 'to');
	expect(getText(wiki, 'yeslinks')).toBe('<$list filter="" emptyMessage="[[to]]"/>\n[[to]]');
	expect(getText(wiki, 'nolinks')).toBe('\\rules except prettylink\n<$list filter="" emptyMessage="[[to]]"/>\n[[from]]');
});

it('widgets nested as macro arguments', function() {
	// Turns out nested wikitext in macro parameters doesn't obey \rules
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: 'yesLinks', text: '<<macro text:"[[from]]">>\n[[from]]'},
		{title: 'noLinks',  text: '\\rules except html\n<<macro text:"[[from]]">>\n[[from]]'},
		{title: 'yesWidgets', text: '<<macro text:"<$link to=\'from\' />">>\n<$link to=\'from\' />'},
		{title: 'noWidgets', text: '\\rules except html\n<<macro text:"<$link to=\'from\' />">>\n<$link to=\'from\' />'},
		utils.attrConf('$link', 'to', 'title'),
		utils.macroConf('macro', 'text', 'wikitext')
	]);

	expect(utils.getReport('yesWidgets', wiki)).toEqual({from: ['<<macro text: "<$link to />">>', '<$link to />']});
	expect(utils.getReport('noWidgets', wiki)).toEqual({from: ['<<macro text: "<$link to />">>']});

	utils.spyFailures(spyOn);
	wiki.renameTiddler('from', 'to]]there');
	expect(getText(wiki, 'yesLinks')).toBe('<<macro text:"<$link to=to]]there/>">>\n<$link to=to]]there/>');
	expect(getText(wiki, 'noLinks')).toBe('\\rules except html\n<<macro text:"<$link to=to]]there/>">>\n[[from]]');
	expect(utils.failures).toHaveBeenCalledTimes(1);
	expect(utils.failures.calls.first().args[0]).toEqual(['noLinks']);
});

it('widgets nested as widget arguments', function() {
	// Turns out nested wikitext in macro parameters doesn't obey \rules
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: 'yesLinks', text: '<$list emptyMessage="[[from]]"/>\n[[from]]'},
		{title: 'noLinks',  text: '\\rules except html\n<$list emptyMessage="[[from]]"/>\n[[from]]'},
		utils.attrConf('$link', 'to', 'title'),
		utils.attrConf('$list', 'emptyMessage', 'wikitext')
	]);

	utils.spyFailures(spyOn);
	wiki.renameTiddler('from', 'to]]there');
	expect(getText(wiki, 'yesLinks')).toBe('<$list emptyMessage="<$link to=to]]there/>"/>\n<$link to=to]]there/>');
	expect(getText(wiki, 'noLinks')).toBe('\\rules except html\n<$list emptyMessage="[[from]]"/>\n[[from]]');
	// Two failures because the nested [[from]] gets parsed as wikitext,
	// and not as an attribute, so it still tries (and fails) to relink.
	expect(utils.failures).toHaveBeenCalledTimes(1);
	expect(utils.failures.calls.first().args[0]).toEqual(['noLinks']);
});

it('doesn\'t impact macrodef blocks', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: 'yes', text: '\\define link() [[from]]\n[[from]]'},
		{title: 'no', text: '\\rules except prettylink\n\\define link() [[from]]\n[[from]]'}]);

	expect(utils.getReport('yes', wiki)).toEqual({from: ['\\define link() [[from]]', '[[from]]']});
	expect(utils.getReport('no', wiki)).toEqual({from: ['\\define link() [[from]]']});
	wiki.renameTiddler('from', 'to');
	expect(getText(wiki, 'yes')).toBe('\\define link() [[to]]\n[[to]]');
	expect(getText(wiki, 'no')).toBe('\\rules except prettylink\n\\define link() [[to]]\n[[from]]');
});

it('doesn\'t impact filter operator wikitext', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: 'yes', text: '<$list filter="[text[{{from}}]]"/>\n{{from}}'},
		{title: 'no', text: '\\rules except transcludeinline transcludeblock\n<$list filter="[text[{{from}}]]"/>\n{{from}}'},
		utils.operatorConf('text', 'wikitext'),
		utils.attrConf('$list', 'filter', 'filter')]);

	expect(utils.getReport('yes', wiki)).toEqual({from: ['<$list filter="[text[{{}}]]" />', '{{}}']});
	expect(utils.getReport('no', wiki)).toEqual({from: ['<$list filter="[text[{{}}]]" />']});
	wiki.renameTiddler('from', 'to');
	expect(getText(wiki, 'yes')).toBe('<$list filter="[text[{{to}}]]"/>\n{{to}}');
	expect(getText(wiki, 'no')).toBe('\\rules except transcludeinline transcludeblock\n<$list filter="[text[{{to}}]]"/>\n{{from}}');
});

});
