/*\

Tests the filter tiddler type.

\*/

var utils = require("./utils");

describe('tiddler type', function() {

beforeEach(function() {
	spyOn(console, 'log');
});

it('javascript allows fields to be processed', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		utils.fieldConf('list', 'list'),
		{title: 'test.js', list: 'A from', text: '"use string";', type: 'application/javascript'}]);
	var report = utils.getReport('test.js', wiki);
	// We test "report.A" and "report.from" explicitly instead of "report",
	// because relink-field-names may be introducing irrelevant reports here.
	expect(report.A).toEqual(['list']);
	expect(report.from).toEqual(['list']);
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

it('application/x-tiddler-filter types', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.operatorConf('tag'));
	wiki.addTiddler(utils.operatorConf('title'));
	wiki.addTiddler({title: 'op', type: 'application/x-tiddler-filter', text: '[tag[from]]'});
	wiki.addTiddler({title: 'raw', type: 'application/x-tiddler-filter', text: '"from"'});
	expect(utils.getReport('op', wiki)).toEqual({from: ['[tag[]]']});
	expect(utils.getReport('raw', wiki)).toEqual({from: ['']});
	wiki.renameTiddler('from', 'to');
	expect(utils.getText('op', wiki)).toEqual('[tag[to]]');
	expect(utils.getText('raw', wiki)).toEqual('"to"');
});

// This is a legacy type
it('text/x-tiddler-filter types', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.operatorConf('tag'));
	wiki.addTiddler(utils.operatorConf('title'));
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
	wiki.addTiddlers([
		utils.operatorConf('tag'),
		utils.exceptionConf('$:/DefaultTiddlers'),
		{title: '$:/DefaultTiddlers', text: '[tag[from]]'}]);
	// We test 'from' directly because relink-titles adds a useless '$:' option
	expect(utils.getReport('$:/DefaultTiddlers', wiki).from).toEqual(['[tag[]]']);
	wiki.renameTiddler('from', 'to');
	expect(utils.getText('$:/DefaultTiddlers', wiki)).toEqual('[tag[to]]');
});

it("application/x-tiddler-title types", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: 'test', text: 'from here', type: "application/x-tiddler-title"});
	expect(utils.getReport('test', wiki)).toEqual({'from here': ['']});
	wiki.renameTiddler('from here', 'to there');
	expect(wiki.getTiddler('test').fields.text).toEqual('to there');
	expect(utils.getReport('test', wiki)).toEqual({'to there': ['']});
});

it("application/x-tiddler-list types", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: 'test', text: '[[from here]] from', type: "application/x-tiddler-list"});
	expect(utils.getReport('test', wiki)).toEqual({'from here': [''], from: ['']});
	wiki.renameTiddler('from', 'to');
	expect(wiki.getTiddler('test').fields.text).toEqual('[[from here]] to');

	// Test that it fails gracefully
	utils.spyFailures(spyOn);
	wiki.renameTiddler('to', 'bad]] bad name');
	expect(utils.failures).toHaveBeenCalledTimes(1);
	expect(wiki.getTiddler('test').fields.text).toEqual('[[from here]] to');
});

it("application/x-tiddler-reference types", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: 'test', text: 'from here!!field', type: "application/x-tiddler-reference"});
	expect(utils.getReport('test', wiki)).toEqual({'from here': ['!!field']});
	wiki.renameTiddler('from here', 'to there');
	expect(wiki.getTiddler('test').fields.text).toEqual('to there!!field');

	// Test that it fails gracefully
	utils.spyFailures(spyOn);
	wiki.renameTiddler('to there', 'bad!!name');
	expect(utils.failures).toHaveBeenCalledTimes(1);
	expect(wiki.getTiddler('test').fields.text).toEqual('to there!!field');
});

});
