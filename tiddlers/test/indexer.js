/*\

Tests the relink indexer

\*/

var utils = require("test/utils");
var getReport = utils.getReport;
var operators = $tw.modules.getModulesByTypeAsHashmap('relinkoperator');
var contexts = $tw.modules.applyMethods('relinkcontext');


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

it("only checks tiddler contexts if and when they need checking", function() {
	var wiki = new $tw.Wiki();
	spyOn(contexts.tiddler.prototype, 'changed').and.callThrough();
	wiki.addTiddlers([
		{title: 'A', text: '\\import [tag[macro]]\n<<M x>>'},
		{title: 'B', text: '[[link]]'},
		{title: 'C', text: 'irrelevant text'}]);
	// We cache each of these
	// TODO: It'd be easier to use a back references, since that'd auto touch them.
	getReport('A', wiki);
	getReport('B', wiki);
	getReport('C', wiki);
	wiki.addTiddler({title: 'unrelated', text: 'unrelated'});
	wiki.addTiddler({title: 'new', tags: 'macro', text: '\\relink M arg\n\\define M(arg) X'});
	expect(getReport('A', wiki)).toEqual({x: ['<<M arg>>']});
	expect(contexts.tiddler.prototype.changed).toHaveBeenCalledTimes(1);
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

it("does not goof and give wrong report if changes cached", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: 'A', text: '\\import anything'});
	// Cache this tiddler (which requires its context to be remembered
	getReport('A', wiki);
	// Add another
	wiki.addTiddler({title: 'B', text: '[[expected]]'});
	// When we get B, indexer used to return A, because it goofed its variables
	// when checking A's context with changes involving B.
	expect(getReport('B', wiki)).toEqual({expected: ['[[expected]]']});
});

});
