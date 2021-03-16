/*\

Tests the filter tiddler type.

\*/

var utils = require("test/utils");

describe('tiddler type', function() {

beforeEach(function() {
	spyOn(console, 'log');
});

it('javascript allows fields to be processed', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		utils.fieldConf('list', 'list'),
		{title: 'test.js', list: 'A from', text: '"use string";', type: 'application/javascript'}]);
	expect(utils.getReport('test.js', wiki)).toEqual({A: ['list'], from: ['list']});
	wiki.renameTiddler('from', 'to');
	expect(wiki.getTiddler('test.js').fields.list).toEqual(['A', 'to']);
});

it('javascript body is not treated like wikitext', function() {
	var text = '"use string"; [[from]]';
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: 'test.js', text: text, type: 'application/javascript'}]);
	expect(utils.getReport('test.js', wiki)).toEqual({});
	wiki.renameTiddler('from', 'to');
	expect(console.log).not.toHaveBeenCalled();
	expect(utils.getText('test.js', wiki)).toEqual(text);
});

it('x-tiddler-filter types', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.operatorConf('tag'));
	wiki.addTiddler({title: 'op', type: 'text/x-tiddler-filter', text: '[tag[from]]'});
	wiki.addTiddler({title: 'raw', type: 'text/x-tiddler-filter', text: '"from"'});
	expect(utils.getReport('op', wiki)).toEqual({from: ['[tag[]]']});
	expect(utils.getReport('raw', wiki)).toEqual({from: ['']});
	wiki.renameTiddler('from', 'to');
	expect(utils.getText('op', wiki)).toEqual('[tag[to]]');
	expect(utils.getText('raw', wiki)).toEqual('"to"');
});

it('$:/DefaultTiddlers', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.operatorConf('tag'));
	wiki.addTiddler({title: '$:/DefaultTiddlers', text: '[tag[from]]'});
	// We test 'from' directly because relink-titles adds a useless '$:' option
	expect(utils.getReport('$:/DefaultTiddlers', wiki).from).toEqual(['[tag[]]']);
	wiki.renameTiddler('from', 'to');
	expect(utils.getText('$:/DefaultTiddlers', wiki)).toEqual('[tag[to]]');
});

});
