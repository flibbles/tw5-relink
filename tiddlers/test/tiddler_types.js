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
	wiki.addTiddler({title: 'test/op', type: 'text/x-tiddler-filter', text: '[tag[from]]'});
	wiki.addTiddler({title: 'test/raw', type: 'text/x-tiddler-filter', text: '"from"'});
	expect(utils.getReport('test/op', wiki)).toEqual({from: ['[tag[]]']});
	expect(utils.getReport('test/raw', wiki)).toEqual({from: ['']});
	wiki.renameTiddler('from', 'to');
	expect(utils.getText('test/op', wiki)).toEqual('[tag[to]]');
	expect(utils.getText('test/raw', wiki)).toEqual('"to"');
});

it('$:/DefaultTiddlers', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.operatorConf('tag'));
	wiki.addTiddler({title: '$:/DefaultTiddlers', text: '[tag[from]]'});
	expect(utils.getReport('$:/DefaultTiddlers', wiki)).toEqual({from: ['[tag[]]']});
	wiki.renameTiddler('from', 'to');
	expect(utils.getText('$:/DefaultTiddlers', wiki)).toEqual('[tag[to]]');
});

});
