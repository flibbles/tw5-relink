/*\

Tests the relink indexer

\*/

var utils = require("test/utils");
var getReport = utils.getReport;
var operators = $tw.modules.getModulesByTypeAsHashmap('relinkoperator');

//TODO: imports in wikitext fields get properly updated when import list changes
//TODO: imported tiddlers get renamed or relinked

describe("indexer", function() {

it("caches report results when indexing", function() {
	var wiki = new $tw.Wiki();
	spyOn(operators.text, 'report').and.callThrough();
	wiki.addTiddlers([
		{title: 'test', text: '\\import macros\n<<M x>>'},
		// We have it import macros, but those macros don't change
		{title: 'macros', text: '\\relink M arg\n\\define M(arg) X'}]);
	expect(getReport('test', wiki)).toEqual({macros: ['\\import'], x: ['<<M arg>>']});
	wiki.addTiddler({title: 'unrelated', text: 'unrelated'});
	expect(getReport('test', wiki)).toEqual({macros: ['\\import'], x: ['<<M arg>>']});
	expect(operators.text.report).toHaveBeenCalledTimes(1);
});

it("doesn't cache report results when not indexing", function() {
	var wiki = new $tw.Wiki({enableIndexers: []});
	spyOn(operators.text, 'report').and.callThrough();
	wiki.addTiddler({title: 'test', text: '[[x]]'});
	expect(getReport('test', wiki)).toEqual({x: ['[[x]]']});
	expect(getReport('test', wiki)).toEqual({x: ['[[x]]']});
	expect(operators.text.report).toHaveBeenCalledTimes(2);
});

it("detects changes to configuration", async function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: 'test', filter: '[tag[x]]'});
	expect(wiki.getTiddlerRelinkReferences('test')).toEqual({});
	wiki.addTiddler(utils.operatorConf('tag'));
	wiki.addTiddler(utils.fieldConf('filter', 'filter'));
	await utils.flush();
	expect(getReport('test', wiki)).toEqual({x: ['filter: [tag[]]']});
});

it("detects changes to global macro definitions", async function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: 'test', text: '<<M x>>'});
	expect(getReport('test', wiki)).toEqual({});
	wiki.addTiddler({title: 'def', tags: '$:/tags/Macro', text: '\\relink M arg\n\\define M(arg) $arg$'});
	await utils.flush();
	expect(getReport('test', wiki)).toEqual({x: ['<<M arg>>']});
});

it("updates when import tiddler list would grow", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: 'test', text: '\\import [tag[local]]\n<<M from>>'},
		{title: 'macro', tags: 'local', text: '\\define M(val) $from$'}]);
	expect(getReport('test', wiki)).toEqual({});
	wiki.addTiddler({title: 'inline', tags: 'local', text: '\\relink M val'});
	expect(getReport('test', wiki)).toEqual({from: ['<<M val>>']});
});

it("updates when import tiddler list would shrink", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: 'test', text: '\\import [tag[local]]\n<<M Aarg:A Barg:B>>'},
		{title: 'global', tags: '$:/tags/Macro', text: '\\relink M Aarg'},
		{title: 'macro', tags: 'local', text: '\\relink M Barg'}]);
	expect(getReport('test', wiki)).toEqual({A: ['<<M Aarg>>'], B: ['<<M Barg>>']});

	wiki.deleteTiddler('macro');
	expect(getReport('test', wiki)).toEqual({A: ['<<M Aarg>>']});
});

it("updates when tiddler in import list changes", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: 'test', text: '\\import [tag[local]]\n<<M Aarg:A Barg:B>>'},
		{title: 'macro', tags: 'local', text: '\\relink M Aarg'}]);
	expect(getReport('test', wiki)).toEqual({A: ['<<M Aarg>>']});
	wiki.addTiddler({title: 'macro', tags: 'local', text: '\\relink M Barg'});
	expect(getReport('test', wiki)).toEqual({B: ['<<M Barg>>']});
});

it('updates when relevant $importvariables exists', function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: 'test', text: '\\define garbage() fdfd\n<$importvariables filter="[tag[local]]">\n\n<<M Aarg:A Barg:B>></$importvariables>'},
		{title: 'macro', tags: 'local', text: '\\relink M Aarg'}]);
	expect(getReport('test', wiki)).toEqual({A: ['<<M Aarg>>']});
	wiki.addTiddler({title: 'macro', tags: 'local', text: '\\relink M Barg'});
	expect(getReport('test', wiki)).toEqual({B: ['<<M Barg>>']});
});

});
