/*\

Tests the filter tiddler type.

\*/

var utils = require("test/utils");

describe('filter tiddlers', function() {

beforeEach(function() {
	spyOn(console, 'log');
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
