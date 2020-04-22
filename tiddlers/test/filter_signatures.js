/*\

Tests the signatures filter.

\*/

var utils = require("test/utils");

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
	var wiki = new $tw.Wiki();
	var conf = utils.fieldConf("test", "reference");
	wiki.addTiddler(conf);
	test(wiki, ["fields/test"]);
	source(wiki, "fields/test", conf.title);
	type(wiki, "fields/test", "reference");
});

it("works for operators", function() {
	var wiki = new $tw.Wiki();
	var conf = utils.operatorConf("test", "reference");
	wiki.addTiddler(conf);
	test(wiki, ["operators/test"]);
	source(wiki, "operators/test", conf.title);
	type(wiki, "operators/test", "reference");
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
	var wiki = new $tw.Wiki();
	var content = { tiddlers: {
		[utils.macroConf("test", "plugin").title]: {"text": "filter"},
		[utils.macroConf("test", "override").title]: {"text": "filter"}
	}};
	wiki.addTiddlers([
		utils.macroConf("test", "user"),
		utils.macroConf("test", "override")]);
	wiki.addTiddler({
		title: "testPlugin",
		type: "application/json",
		"plugin-type": "plugin",
		text: JSON.stringify(content)});
	wiki.registerPluginTiddlers("plugin");
	wiki.readPluginInfo();
	wiki.unpackPluginTiddlers();
	// Overrides continue to show up as their plugin versions
	test(wiki, ["macros/test/user"]);
	test(wiki, ["macros/test/plugin", "macros/test/override"],"testPlugin");
});

it("source and type for missing keys", function() {
	var wiki = new $tw.Wiki();
	source(wiki, "anything", undefined);
	type(wiki, "anything", undefined);
});

});
