/*\

Tests the relink indexer

\*/

var utils = require("test/utils");

var operators = $tw.modules.getModulesByTypeAsHashmap('relinkoperator');


describe("import pragma", function() {

it("caches report results when indexing", function() {
	var wiki = new $tw.Wiki();
	spyOn(operators.text, 'report').and.callThrough();
	wiki.addTiddler({title: 'test', text: '[[x]]'});
	expect(wiki.getTiddlerRelinkReferences('test')).toEqual({x: ['[[x]]']});
	wiki.addTiddler({title: 'unrelated', text: 'unrelated'});
	expect(wiki.getTiddlerRelinkReferences('test')).toEqual({x: ['[[x]]']});
	expect(operators.text.report).toHaveBeenCalledTimes(1);
});

it("doesn't cache report results when not indexing", function() {
	var wiki = new $tw.Wiki({enableIndexers: []});
	spyOn(operators.text, 'report').and.callThrough();
	wiki.addTiddler({title: 'test', text: '[[x]]'});
	expect(wiki.getTiddlerRelinkReferences('test')).toEqual({x: ['[[x]]']});
	expect(wiki.getTiddlerRelinkReferences('test')).toEqual({x: ['[[x]]']});
	expect(operators.text.report).toHaveBeenCalledTimes(2);
});

it("detects changes to configuration", async function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: 'test', filter: '[tag[x]]'});
	expect(wiki.getTiddlerRelinkReferences('test')).toEqual({});
	wiki.addTiddler(utils.operatorConf('tag'));
	wiki.addTiddler(utils.fieldConf('filter', 'filter'));
	await utils.flush();
	expect(wiki.getTiddlerRelinkReferences('test')).toEqual({x: ['filter: [tag[]]']});
});

it("detects changes to global macro definitions", async function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: 'test', text: '<<macro x>>'});
	expect(wiki.getTiddlerRelinkReferences('test')).toEqual({});
	wiki.addTiddler({title: 'def', tags: '$:/tags/Macro', text: '\\relink macro arg\n\\define macro(arg) $arg$'});
	await utils.flush();
	expect(wiki.getTiddlerRelinkReferences('test')).toEqual({x: ['<<macro arg>>']});
});

/*
it("reports when import tiddler list would change", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers(utils.setupTiddlers());
	wiki.addTiddlers([
		{title: 'test', text: '\\import [tag[local]]\n<<macro from>>'},
		{title: 'macro', tags: 'local', text: '\\define macro(val) $from$'}]);
	var refs = wiki.getTiddlerRelinkReferences('test');
	expect(refs).toEqual({local: ['\\import [tag[]]']});
	wiki.addTiddler({title: 'inline', tags: 'local', text: '\\relink macro val'});
	refs = wiki.getTiddlerRelinkReferences('test');
	expect(refs).toEqual({local: ['\\import [tag[]]'], from: ['<<macro val>>']});
});
*/

});
