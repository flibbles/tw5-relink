/*\

Tests the signatures filter.

\*/

var utils = require("./utils");

function test(wiki, expected, plugin) {
	plugin = plugin || "";
	var output = wiki.filterTiddlers("[relink:signatures["+plugin+"]]");
	expect(output).toEqual(expected);
};

function source(wiki, signature, expected) {
	var rtn = wiki.filterTiddlers("[relink:source[]]", undefined, [signature]);
	expect(rtn[0]).toEqual(expected);
};

function type(wiki, signature, expected) {
	var rtn = wiki.filterTiddlers("[relink:type[]]", undefined, [signature]);
	expect(rtn[0]).toEqual(expected);
};

describe('filter: signatures', function() {

it("works for attributes", function() {
	var wiki = new $tw.Wiki();
	var conf = utils.attrConf("test", "attr", "reference");
	wiki.addTiddler(conf);
	test(wiki, ["attributes/test/attr"]);
	source(wiki, "attributes/test/attr", conf.title);
	type(wiki, "attributes/test/attr", "reference");
});

it("works for fields", function() {
	const wiki = new $tw.Wiki();
	const conf = utils.fieldConf("test", "reference");
	wiki.addTiddler(conf);
	test(wiki, ["fields/test"]);
	source(wiki, "fields/test", conf.title);
	type(wiki, "fields/test", "reference");
});

it("works for operators", function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		utils.operatorConf("test", "reference"),
		utils.operatorConf("test", "wikitext", "2")]);
	test(wiki, ["operators/test", "operators/test/2"]);
	source(wiki, "operators/test", '$:/config/flibbles/relink/operators/test');
	type(wiki, "operators/test", "reference");
	source(wiki, "operators/test/2", '$:/config/flibbles/relink/operators/test/2');
	type(wiki, "operators/test/2", "wikitext");
});

it("works for macros", function() {
	var wiki = new $tw.Wiki();
	var conf = utils.macroConf("test", "param", "reference");
	wiki.addTiddler(conf);
	wiki.addTiddler({title: "B", text: "\\relink inline val", tags: "$:/tags/Macro"});
	test(wiki, ["macros/test/param", "macros/inline/val"]);
	source(wiki, "macros/test/param", conf.title);
	type(wiki, "macros/test/param", "reference");
});

it("filters by plugin if supplied", function() {
	var wiki = utils.addPlugin("testPlugin", [
		utils.macroConf("test", "override", "filter"),
		utils.macroConf("test", "plugin", "filter")]);
	wiki.addTiddlers([
		utils.macroConf("test", "user"),
		utils.macroConf("test", "override")]);
	// Overrides continue to show up as their plugin versions
	test(wiki, ["macros/test/user"]);
	test(wiki, ["macros/test/override", "macros/test/plugin"],"testPlugin");
});

it("source and type for missing keys", function() {
	var wiki = new $tw.Wiki();
	source(wiki, "anything", undefined);
	type(wiki, "anything", undefined);
});

it("source is correct after overrides", function() {
	var wiki = utils.addPlugin("testPlugin",  [
		utils.macroConf("test", "param", "wikitext")]);
	wiki.addTiddler(
		{title: "A", tags: "$:/tags/Macro", text: "\\relink test param:reference"});
	test(wiki, ["macros/test/param"]);
	test(wiki, [], "testPlugin");
	source(wiki, "macros/test/param", "A");
	type(wiki, "macros/test/param", "reference");
});

it("will properly categorize plugin inline declarations", function() {
	var wiki = utils.addPlugin("myPlugin", [
		{title: "myPage", tags: "$:/tags/Macro", text: "\\relink mac param"}]);
	test(wiki, []);
	test(wiki, ["macros/mac/param"], "myPlugin");
	source(wiki, "macros/mac/param", "myPage");
	type(wiki, "macros/mac/param", "title");
});

it("resolves legacy types", function() {
	var wiki = new $tw.Wiki();
	// Gotta test this with the mock fieldtype, cause resolving to title
	// means nothing. It's the super default
	wiki.addTiddler(utils.fieldConf("test", "old-dummy-type"));
	test(wiki, ["fields/test"]);
	type(wiki, "fields/test", "dummy-type");
});

it("ignores drafts", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{	title: "test",
			tags: "$:/tags/Macro",
			"list-before": "",
			text: "\\relink macro param:reference"},
		utils.draft({title: "test", tags: "$:/tags/Macro",
			text: "\\relink macro param:wikitext\n\\relink macro dontshow"})]);
	test(wiki, ["macros/macro/param"]);
	source(wiki, "macros/macro/param", "test");
	type(wiki, "macros/macro/param", "reference");
});

});
