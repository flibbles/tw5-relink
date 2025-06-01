/*\

Tests the relink indexer

\*/

var utils = require("./utils");
var operators = $tw.modules.getModulesByTypeAsHashmap('relinkoperator');
var contexts = $tw.modules.applyMethods('relinkcontext');
var wiki;

describe("indexer", function() {

beforeEach(function() {
	wiki = new $tw.Wiki();
});

describe("references", function() {

var getReport = utils.getReport;

it("caches report results when indexing", function() {
	spyOn(operators.text, 'report').and.callThrough();
	wiki.addTiddlers([
		utils.operatorConf("title"),
		{title: 'test', text: '\\import macros\n<<M x>>'},
		// We have it import macros, but those macros don't change
		{title: 'macros', text: '\\relink M arg\n\\define M(arg) X'}]);
	var report = getReport('test', wiki);
	expect(report.macros).toEqual(['\\import']);
	expect(report.x).toEqual(['<<M arg>>']);
	// called three times, because every tiddler gets indexed.
	expect(operators.text.report).toHaveBeenCalledTimes(3);
	operators.text.report.calls.reset();
	wiki.addTiddler({title: 'unrelated', text: 'unrelated'});
	report = getReport('test', wiki);
	expect(report.macros).toEqual(['\\import']);
	expect(report.x).toEqual(['<<M arg>>']);
	expect(operators.text.report).toHaveBeenCalledTimes(1);
});

it("globally caches report results when not indexing", function() {
	wiki = new $tw.Wiki({enableIndexers: []});
	spyOn(operators.text, 'report').and.callThrough();
	wiki.addTiddler({title: 'test', text: '[[x]]'});
	expect(getReport('test', wiki)).toEqual({x: ['[[x]]']});
	expect(getReport('test', wiki)).toEqual({x: ['[[x]]']});
	expect(operators.text.report).toHaveBeenCalledTimes(1);
	operators.text.report.calls.reset();
	wiki.addTiddler({title: 'other', text: 'text'});
	expect(getReport('test', wiki)).toEqual({x: ['[[x]]']});
	expect(operators.text.report).toHaveBeenCalledTimes(2);
});

it("detects changes to configuration", async function() {
	wiki.addTiddler({title: 'test', filter: '[tag[x]]'});
	expect(getReport('test', wiki).x).toBeUndefined();
	wiki.addTiddler(utils.operatorConf('tag'));
	wiki.addTiddler(utils.fieldConf('filter', 'filter'));
	await utils.flush();
	expect(getReport('test', wiki).x).toEqual(['filter: [tag[]]']);
});

it("only checks tiddler contexts if and when they need checking", function() {
	spyOn(contexts.tiddler.prototype, 'changed').and.callThrough();
	wiki.addTiddlers([
		{title: 'A', text: '\\import [tag[macro]]\n<<M x>>'},
		{title: 'B', text: '[[link]]'},
		{title: 'C', text: 'irrelevant text'}]);
	// We cache each of these
	getReport('A', wiki);
	getReport('B', wiki);
	getReport('C', wiki);
	wiki.addTiddler({title: 'unrelated', text: 'unrelated'});
	wiki.addTiddler({title: 'new', tags: 'macro', text: '\\relink M arg\n\\define M(arg) X'});
	expect(getReport('A', wiki).x).toEqual(['<<M arg>>']);
	expect(contexts.tiddler.prototype.changed).toHaveBeenCalledTimes(1);
});

it("doesn't update changed & importing tiddlers multiple times", function () {
	wiki.addTiddlers([
		utils.operatorConf('title'),
		{title: 'A', text: 'stuff'},
		{title: 'B', text: '\\import A\n[[c|link1]]'}]);
	expect(getReport('B', wiki)).toEqual({A: ['\\import'], link1: ['[[c]]']});
	spyOn(operators.text, 'report').and.callThrough();
	wiki.addTiddlers([
		{title: 'A', text: 'other stuff'},
		{title: 'B', text: '\\import A\n[[c|link2]]'}]);
	expect(getReport('B', wiki)).toEqual({A: ['\\import'], link2: ['[[c]]']});
	// Once for A and B. B should not be refreshed twice.
	expect(operators.text.report).toHaveBeenCalledTimes(2);
});

it("doesn't update deleted & importing tiddlers", function () {
	wiki.addTiddlers([
		utils.operatorConf('title'),
		{title: 'A', text: 'stuff'},
		{title: 'B', text: '\\import A\n[[c|link1]]'}]);
	expect(getReport('B', wiki)).toEqual({A: ['\\import'], link1: ['[[c]]']});
	spyOn(operators.text, 'report').and.callThrough();
	wiki.addTiddler({title: 'A', text: 'other stuff'});
	wiki.deleteTiddler('B');
	expect(getReport('A', wiki)).toEqual({});
	expect(getReport('B', wiki)).toEqual(undefined);
	// Once for A and B. B should not be refreshed twice.
	expect(operators.text.report).toHaveBeenCalledTimes(1);
});

it("doesn't choke when a tiddler is deleted twice", function() {
	wiki.addTiddlers([
		{title: 'A', text: '[[c|link]]'},
		{title: 'B', text: '[[d|link]]'}]);
	expect(getReport('A', wiki)).toEqual({link: ['[[c]]']});
	wiki.deleteTiddler('A');
	wiki.deleteTiddler('A');
	expect(getReport('B', wiki)).toEqual({link: ['[[d]]']});
});

it("detects changes to global macro definitions", async function() {
	wiki.addTiddler({title: 'test', text: '<<M x>>'});
	expect(getReport('test', wiki)).toEqual({});
	wiki.addTiddler({title: 'def', tags: '$:/tags/Macro', text: '\\relink M arg\n\\define M(arg) $arg$'});
	await utils.flush();
	expect(getReport('test', wiki).x).toEqual(['<<M arg>>']);
});

it('detects changes to global macros when <$set> involved', async function() {
	wiki.addTiddlers([
		{title: 'A', tags: '$:/tags/Macro', text: '<$set name=macroA value=A>\n\n</$set>'},
		{title: 'C', tags: '$:/tags/Macro', text: '<$set name=macroC value=C>\n\n</$set>'},
		{title: 'from'}
	]);
	expect(utils.getReport('test', wiki)).toBeUndefined();
	await utils.flush();
	wiki.addTiddler({title: 'B', tags: '$:/tags/Macro', text: '\\relink macro arg\n\\procedure macro(arg) $arg$'});
	wiki.addTiddler({title: 'test', text: '<<macro from>>'});
	expect(utils.getReport('test', wiki).from).toEqual(['<<macro arg>>']);
});

it("updates when import tiddler list would grow", function() {
	wiki.addTiddlers([
		{title: 'test', text: '\\import [tag[local]]\n<<M from>>'},
		{title: 'macro', tags: 'local', text: '\\define M(val) $val$'}]);
	expect(getReport('test', wiki).from).toBeUndefined();
	wiki.addTiddler({title: 'inline', tags: 'local', text: '\\relink M val'});
	expect(getReport('test', wiki).from).toEqual(['<<M val>>']);
});

it("updates when import tiddler list would shrink", function() {
	wiki.addTiddlers([
		{title: 'test', text: '\\import [tag[local]]\n<<M Aarg:A Barg:B>>'},
		{title: 'global', tags: '$:/tags/Macro', text: '\\relink M Aarg'},
		{title: 'macro', tags: 'local', text: '\\relink M Barg'}]);
	expect(getReport('test', wiki)).toEqual({A: ['<<M Aarg>>'], B: ['<<M Barg>>']});

	wiki.deleteTiddler('macro');
	expect(getReport('test', wiki)).toEqual({A: ['<<M Aarg>>']});
});

it("updates when tiddler in import list changes", function() {
	wiki.addTiddlers([
		{title: 'test', text: '\\import [tag[local]]\n<<M Aarg:A Barg:B>>'},
		{title: 'macro', tags: 'local', text: '\\relink M Aarg'}]);
	expect(getReport('test', wiki)).toEqual({A: ['<<M Aarg>>']});
	wiki.addTiddler({title: 'macro', tags: 'local', text: '\\relink M Barg'});
	expect(getReport('test', wiki)).toEqual({B: ['<<M Barg>>']});
});

it("updates when tiddler in import list renames", function() {
	spyOn(console, 'log');
	wiki.addTiddlers([
		utils.operatorConf("title"),
		{title: 'test', text: '\\import macro\n<<M arg:A>>'},
		{title: 'macro', text: '\\relink M arg'}]);
	expect(getReport('test', wiki)).toEqual({macro: ['\\import'], A: ['<<M arg>>']});
	wiki.renameTiddler('macro', 'newmacro');
	expect(getReport('test', wiki)).toEqual({newmacro: ['\\import'], A: ['<<M arg>>']});
});

it("removes old reports when target tiddler renamed", function() {
	spyOn(console, 'log');
	wiki.addTiddler({title: 'test', text: '[[link]]'});
	// We do this to keep pesky modified fields from showing up.
	wiki.addTiddler({title: '$:/config/TimestampDisable', text: 'yes'});
	expect(getReport('test', wiki)).toEqual({link: ['[[link]]']});
	wiki.renameTiddler('test', 'newtest');
	expect(getReport('test', wiki)).toEqual(undefined);
	expect(getReport('newtest', wiki)).toEqual({link: ['[[link]]']});
});

it("removes old reports when target tiddler deleted", function() {
	wiki.addTiddler({title: 'test', text: '[[link]]'});
	expect(getReport('test', wiki)).toEqual({link: ['[[link]]']});
	wiki.deleteTiddler('test');
	expect(getReport('test', wiki)).toEqual(undefined);
});

it('updates when relevant $importvariables exists', function() {
	wiki.addTiddlers([
		{title: 'test', text: '\\define garbage() fdfd\n<$importvariables filter="[tag[local]]">\n\n<<M Aarg:A Barg:B>></$importvariables>'},
		{title: 'macro', tags: 'local', text: '\\relink M Aarg'}]);
	expect(getReport('test', wiki)).toEqual({A: ['<<M Aarg>>']});
	wiki.addTiddler({title: 'macro', tags: 'local', text: '\\relink M Barg'});
	expect(getReport('test', wiki)).toEqual({B: ['<<M Barg>>']});
});

it('updates when relevant $importvariables in fields exist', function() {
	wiki.addTiddlers([
		utils.fieldConf('wikitext', 'wikitext'),
		{title: 'test', wikitext: '<$importvariables filter="[tag[local]]"><<M Aarg:A Barg:B>></$importvariables>'},
		{title: 'macro', tags: 'local', text: '\\relink M Aarg'}]);
	expect(getReport('test', wiki).A).toEqual(['wikitext: <<M Aarg>>']);
	expect(getReport('test', wiki).B).toBeUndefined();
	wiki.addTiddler({title: 'macro', tags: 'local', text: '\\relink M Barg'});
	expect(getReport('test', wiki).A).toBeUndefined();
	expect(getReport('test', wiki).B).toEqual(['wikitext: <<M Barg>>']);
});

(utils.atLeastVersion('5.2.0') ? it : xit)('updates for relevant $importvariables in nested context', function() {
	wiki.addTiddlers([
		utils.attrConf('$list', 'emptyMessage', 'wikitext'),
		utils.macroConf('wikiwrapper', 'text', 'wikitext'),
		utils.operatorConf('wikiop', 'wikitext'),
		{title: 'test', text: '<$list filter="" emptyMessage="""<<wikiwrapper text:\'{{{ [wikiop[<$importvariables filter="macro"><<M Aarg:A Barg:B>></$importvariables>]] }}}\' >>""" />'},
		{title: 'macro', tags: 'local', text: '\\relink M Aarg'}]);
	expect(getReport('test', wiki)).toEqual({A: ['<$list emptyMessage="<<wikiwrapper text: "{{{[wikiop[<<M Aarg>>]]}}}">>" />']});
	wiki.addTiddler({title: 'macro', tags: 'local', text: '\\relink M Barg'});
	expect(getReport('test', wiki)).toEqual({B: ['<$list emptyMessage="<<wikiwrapper text: "{{{[wikiop[<<M Barg>>]]}}}">>" />']});
});

it("does not goof and give wrong report if changes cached", function() {
	wiki.addTiddler({title: 'A', text: '\\import anything\n'});
	// Cache this tiddler (which requires its context to be remembered
	getReport('A', wiki);
	// Add another
	wiki.addTiddler({title: 'B', text: '[[expected]]'});
	// When we get B, indexer used to return A, because it goofed its variables
	// when checking A's context with changes involving B.
	expect(getReport('B', wiki)).toEqual({expected: ['[[expected]]']});
});

});

// BACK REFERENCES
describe("back references", function() {

it("handles references to non-existent tiddlers", function() {
	wiki.addTiddler({title: 'A', text: '[[ghost]]'});
	expect(utils.getBackreferences('ghost', wiki)).toEqual({A: ['[[ghost]]']});
	wiki.addTiddler({title: 'ghost', text: '{{ghost}}'});
	expect(utils.getBackreferences('ghost', wiki)).toEqual({A: ['[[ghost]]'], ghost: ['{{}}']});
	wiki.deleteTiddler('ghost');
	expect(utils.getBackreferences('ghost', wiki)).toEqual({A: ['[[ghost]]']});
});

it("still works without indexer", function() {
	wiki = new $tw.Wiki({enableIndexers: []});
	spyOn(operators.text, 'report').and.callThrough();
	wiki.addTiddlers([
		{title: 'x', text: 'stuff'},
		{title: 'A', text: '[[x]]'},
		{title: 'B', text: '{{x}}'}]);
	expect(utils.getBackreferences('x', wiki)).toEqual({A: ['[[x]]'], B: ['{{}}']});
	// It calls each tiddler for indexing
	expect(operators.text.report).toHaveBeenCalledTimes(3);
	operators.text.report.calls.reset();

	// If we spy and call again, results will still be cached.
	expect(utils.getBackreferences('x', wiki)).toEqual({A: ['[[x]]'], B: ['{{}}']});
	expect(operators.text.report).not.toHaveBeenCalled();

	// If we remove something, the update properly propagates, but everything
	// is indexed again.
	wiki.deleteTiddler('A');
	expect(utils.getBackreferences('x', wiki)).toEqual({B: ['{{}}']});
	expect(operators.text.report).toHaveBeenCalledTimes(2);
});

it("returns empty object for unreferenced tiddlers", function() {
	wiki.addTiddler({title: 'A', text: 'stuff'});
	expect(utils.getBackreferences('A', wiki)).toEqual({});
	expect(utils.getBackreferences('B', wiki)).toEqual({});
});

});

// RELINK REFERENCES
describe("relink results", function() {

var wouldChange = utils.wouldChange;

it('calls getRelinkResults no more than necessary', function() {
	spyOn(operators.text, 'relink').and.callThrough();
	wiki.addTiddlers([
		{title: 'A', text: '[[from]]'},
		{title: 'B', text: 'not linking to from'},
		{title: 'from', text: 'text'},
		utils.draft({title: 'from', text: 'text', 'draft.title': 'to'})]);
	wouldChange(wiki, 'from', 'to');
	expect(operators.text.relink).toHaveBeenCalledTimes(4);
	operators.text.relink.calls.reset();

	wouldChange(wiki, 'from', 'to');
	expect(operators.text.relink).toHaveBeenCalledTimes(0);
	operators.text.relink.calls.reset();

	// Now we change the draft of what we're looking at.
	wiki.addTiddler(utils.draft({title: 'from', text: 'text', 'draft.title': 'too'}));
	wouldChange(wiki, 'from', 'too');
	expect(operators.text.relink).toHaveBeenCalledTimes(1);
	operators.text.relink.calls.reset();

	wouldChange(wiki, 'from', 'too');
	expect(operators.text.relink).toHaveBeenCalledTimes(0);
	operators.text.relink.calls.reset();
});

it("calls getRelinkResults rarely, even with indexers disabled", function() {
	wiki = new $tw.Wiki({enableIndexers: []});
	spyOn(operators.text, 'relink').and.callThrough();
	wiki.addTiddlers([
		{title: 'A', text: '[[from]]'},
		{title: 'B', text: 'not linking to from'},
		{title: 'from', text: 'text'},
		utils.draft({title: 'from', text: 'text', 'draft.title': 'to'})]);
	wouldChange(wiki, 'from', 'to');
	expect(operators.text.relink).toHaveBeenCalledTimes(4);
	operators.text.relink.calls.reset();

	wouldChange(wiki, 'from', 'to');
	expect(operators.text.relink).toHaveBeenCalledTimes(0);
	operators.text.relink.calls.reset();

	// Now we change the draft of what we're looking at.
	wiki.addTiddler(utils.draft({title: 'from', text: 'text', 'draft.title': 'too'}));
	wouldChange(wiki, 'from', 'too');
	expect(operators.text.relink).toHaveBeenCalledTimes(4);
	operators.text.relink.calls.reset();

	wouldChange(wiki, 'from', 'too');
	expect(operators.text.relink).toHaveBeenCalledTimes(0);
	operators.text.relink.calls.reset();
});

it('does not call getRelinkResults on rename after scanning', function() {
	spyOn(console, 'log');
	wiki.addTiddlers([
		{title: 'A', text: '[[from]]'},
		{title: 'B', text: 'not linking to from'},
		{title: 'from', text: 'text'}]);
	// We check the number of changes, like the editTemplate does
	wouldChange(wiki, 'from', 'to');
	spyOn(operators.text, 'relink').and.callThrough();
	// Then we rename the file, and hopefully used the cached results
	wiki.renameTiddler('from', 'to');
	expect(operators.text.relink).toHaveBeenCalledTimes(0);
});

it('discovers when non-cached tiddler should now be on shortlist', function() {
	wiki.addTiddlers([
		{title: 'A', text: ''},
		{title: 'B', text: '\\import A\n<<macro from>>'},
		{title: 'C', text: '[[from]]'},
		{title: 'from', text: 'text'}]);
	// A and B are not on the shortlist
	expect(wouldChange(wiki, 'from', 'to')).toEqual(['C']);
	// A is changed, but now it's B that would be changed if From changes
	wiki.addTiddler({title: 'A', text: '\\define macro(x) $x$\n\\relink macro x'});
	expect(wouldChange(wiki, 'from', 'to')).toEqual(['C', 'B']);
});

it('keeps the relink shortlist as short as possible', function() {
	// This make sure various text patterns don't accidentally get cached
	// for future relink shortlists
	wiki.addTiddlers([
		{title: 'A', text: '[[from here]]'}, //This would change
		{title: 'B', text: '<element>inner content</element>'}, //shouldn't
		{title: 'C', text: '<element><child /></element>'}]); //shouldn't
	expect(wouldChange(wiki, 'from here', 'anything')).toEqual(['A']);
});

it("won't ignore changes to other tiddlers during title rename", function() {
	spyOn(console, 'log');
	wiki.addTiddler(utils.draft({title: 'from', text: 'boring text'}));
	// This caches the results
	expect(wouldChange(wiki, 'from', 'to')).toEqual([]);
	wiki.addTiddler({title: 'A', text: 'links to [[from]]'});
	// Renaming it should touch the draft, even if it wasn't in the shortlist
	wiki.renameTiddler('from', 'to');
	expect(utils.getText('A', wiki)).toBe('links to [[to]]');
});

it("won't ignore current draft if changed after result caching", function() {
	spyOn(console, 'log');
	wiki.addTiddler(utils.draft({title: 'from', text: 'boring text'}));
	// This caches the results
	expect(wouldChange(wiki, 'from', 'to')).toEqual([]);
	wiki.addTiddler(utils.draft({title: 'from', text: 'now links [[from]]'}));
	// Renaming it should touch the draft, even if it wasn't in the shortlist
	wiki.renameTiddler('from', 'to');
	expect(utils.getText("Draft of 'from'", wiki)).toBe('now links [[to]]');
});

it("won't ignore current draft changes if referenced by other", function() {
	// This is an incredibly esoteric case, but if the edited tiddler should
	// be changed after the title is tentatively altered, AND that draft
	// changes \\relink parameters, cause another tiddler not to update.
	const def = '\\define macro(title) This links to $title$';
	spyOn(console, 'log');
	wiki.addTiddlers([
		{title: 'from', tags: 'tag', text: def},
		utils.draft({title: 'from', tags: 'tag', text: def}),
		{title: 'A', text: '\\import [tag[tag]]\n<<macro from>>'}]);
	// This caches the results
	expect(wouldChange(wiki, 'from', 'to')).toEqual([]);
	wiki.addTiddler(utils.draft({title: 'from', tags: 'tag', text: '\\relink macro title\n' + def}));
	// Renaming it should touch the draft, even if it wasn't in the shortlist
	wiki.renameTiddler('from', 'to');
	expect(utils.getText('A', wiki)).toBe('\\import [tag[tag]]\n<<macro to>>');
});

it("can test changes to empty string", function() {
	// This case came up when someone cleared the draft's title, then
	// typed something else it. wouldChange starts returning nothing.
	wiki.addTiddlers([
		utils.fieldConf("tags", "list"),
		{title: 'from', text: "anything"},
		{title: 'Links', text: 'links to [[from]]'},
		// Tags were a problem with issue #57
		{title: 'Tags', tags: 'from'}
	]);
	expect(wouldChange(wiki, 'from', '')).toEqual([]);
	// Now that the results are cached, what would it be now?
	expect(wouldChange(wiki, 'from', 'to')).toEqual(['Links', 'Tags']);
});

});

});
