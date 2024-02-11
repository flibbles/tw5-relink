/*\

Tests various parts of relink that don't require their own suite.

\*/

var utils = require("test/utils");
var relink = utils.relink;

describe('relink', function() {

beforeEach(function() {
	spyOn(console, 'log');
});

function testConfig(options, /* tiddler objects */) {
	var text = "[[from here]]", expected;
	var tiddlerObj = Object.assign({text: text}, options);
	[text, expected, options] = utils.prepArgs(text, options);
	options.wiki.addTiddlers(Array.prototype.slice.call(arguments, 1));
	var results = utils.relink(tiddlerObj, options);
	expect(results.tiddler.fields.text).toEqual(expected);
	return results;
};

it("handles getting no configuration at all", function() {
	testConfig();
});

it("handles inclusive configuration", function() {
	testConfig({}, utils.toUpdateConf("[all[]]"));
	testConfig({tags: "update"}, utils.toUpdateConf("[tag[update]]"));
});

it("properly ignores tiddlers outside of to-update", function() {
	testConfig({ignored: true}, utils.toUpdateConf("[tag[update]]"));
});

it("to-update handles non-existent tiddlers", function() {
	testConfig({}, utils.toUpdateConf("test non-existent"));
});

var shadowTiddler = "$:/plugins/flibbles/test/tiddler";
function wikiWithPlugin() {
	return utils.addPlugin("$:/plugins/flibbles/test", [
		{title: shadowTiddler, text: "Shadow [[from here]]"}
	]);
};

it("doesn't touch shadow tiddlers by default", function() {
	var wiki = wikiWithPlugin();
	utils.relink({}, {wiki: wiki});
	var tiddler = wiki.getTiddler(shadowTiddler);
	expect(tiddler.fields.text).toEqual("Shadow [[from here]]");
});

it("does touch shadow tiddlers when configured to", function() {
	var wiki = wikiWithPlugin();
	wiki.addTiddler(utils.toUpdateConf("[all[tiddlers+shadows]]"));
	utils.relink({}, {wiki: wiki});
	var tiddler = wiki.getTiddler(shadowTiddler);
	expect(tiddler.fields.text).toEqual("Shadow [[to there]]");
});

it("respects touch modify settings", function() {
	// No config (only possible with custom wiki objects
	var results = testConfig({});
	expect(results.wiki.getTiddler("test").fields.modified).toBeUndefined();
	// Yes config (the shadow default)
	var results = testConfig({}, utils.touchModifyConf("yes"));
	expect(results.wiki.getTiddler("test").fields.modified).not.toBeUndefined();
	// No config (turned off)
	var results = testConfig({}, utils.touchModifyConf("no"));
	expect(results.wiki.getTiddler("test").fields.modified).toBeUndefined();
	// Sloppy yes
	var results = testConfig({}, utils.touchModifyConf("yes\n"));
	expect(results.wiki.getTiddler("test").fields.modified).not.toBeUndefined();
});

it("handles reporting errors with at least some grace", function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "tiddlertest", test: "A"},
		utils.fieldConf("test", "list")
	]);
	spyOn($tw.utils, 'parseStringArray').and.throwError('Boom');
	expect(() => utils.getReport('tiddlertest', wiki))
		.toThrowError("Boom\nWhen reporting 'tiddlertest' Relink references");
});

it("handles relinking errors with at least some grace", function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "tiddlertest", test: "A"},
		utils.fieldConf("test", "list")
	]);
	utils.getReport('tiddlertest', wiki);
	spyOn($tw.utils, 'parseStringArray').and.throwError('Boom');
	expect(() => wiki.renameTiddler("anything", "something"))
		.toThrowError("Boom\nWhen relinking 'tiddlertest'");
});

it("doesn't relink if from and to are the same", function() {
	utils.spyFailures(spyOn);
	utils.relink({text: "[[from here]]"}, {to: "from here"});
	expect(console.log).not.toHaveBeenCalled();
	expect(utils.failures).not.toHaveBeenCalled();
});

it("supports IE11", function() {
	// Also, backticks aren't allowed, but there isn't an easy way
	// to test for that.
	var info = $tw.wiki.getPluginInfo("$:/plugins/flibbles/relink");
	for (var title in info.tiddlers) {
		var tiddler = info.tiddlers[title];
		if (tiddler.type !== "application/javascript") {
			continue;
		}
		var text = tiddler.text;
		expect(text.indexOf(".startsWith")).toEqual(-1);
		expect(text.indexOf(".endsWith")).toEqual(-1);
		expect(text.indexOf(".assign")).toEqual(-1);
	}
});

it('can filter for all impossible tiddlers', function() {
	function test(filter, expected) {
		var wiki = new $tw.Wiki(), result;
		wiki.addTiddlers(utils.setupTiddlers());
		wiki.addTiddlers([
			{title: "$:/plugins/flibbles/relink/language/Error/RelinkFilterOperator", text: "This text is pulled"},
			{title: "from"},
			{title: "A", text: "{{{[tag{from}]}}}"},
			{title: "B"},
			{title: "C", text: "[[from]]"}
		]);
		var widget = wiki.makeWidget( { tree: [{type: "widget"}]} );
		widget.setVariable("currentTiddler", "from");
		widget.execute();
		while (widget.children.length > 0) {
			widget = widget.children[0];
		}
		result = wiki.filterTiddlers(filter, widget);
		expect(console.log).not.toHaveBeenCalled();
		expect(console.warn).not.toHaveBeenCalled();
		expect(result).toEqual(expected);
	};
	spyOn(console, 'warn');
	test("[relink:impossible[to}this]]", ["A"]);
	test("[[from]relink:backreferences[]]", ["A", "C"]);
	test("[relink:nonexistent[]]", ["This text is pulled"]);
});

it('did import pluginrule, even though it never uses it', function() {
	var rwtr = $tw.wiki.filterTiddlers("[[relinkwikitextrule]modules[]]");
	// Just make sure there's more than a few so we know we're actually
	// using the right module-type.
	expect(rwtr.length).toBeGreaterThan(5);
	expect(rwtr).toContain("test/modules/pluginrule.js");
});

});

