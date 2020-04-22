/*\

Tests the signatures filter.

\*/

var utils = require("test/utils");

function test(wiki, category, expected, plugin) {
	category = category ? (":"+category) : "";
	plugin = plugin || "";
	var output = wiki.filterTiddlers("[relink:signatures"+category+"["+plugin+"]]");
	expect(output).toEqual(expected);
};

describe('filter: signatures', function() {

it("works for attributes", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler(utils.attrConf("test", "attr", "reference"));
	test(wiki, "attributes", ["test/attr"]);
});

it("works for fields", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler(utils.fieldConf("test", "reference"));
	test(wiki, "fields", ["test"]);
});

it("works for operators", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler(utils.operatorConf("test", "reference"));
	test(wiki, "operators", ["test"]);
});

it("works for macros", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler(utils.macroConf("test", "param", "reference"));
	wiki.addTiddler({title: "B", text: "\\relink inline val", tags: "$:/tags/Macro"});
	test(wiki, "macros", ["test/param", "inline/val"]);
});

it("does nothing with bad suffix", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler(utils.attrConf("test", "attr", "reference"));
	test(wiki, "something", []);
	test(wiki, undefined, []);
});

it("filters by plugin if supplied", function() {
	var wiki = new $tw.Wiki();
	var ref = utils.attrConf("test", "plugin", "filter");
	var content = { tiddlers: {
		[utils.attrConf("test", "plugin").title]: {"text": "filter"},
		[utils.attrConf("test", "override").title]: {"text": "filter"}
	}};
	wiki.addTiddlers([
		utils.attrConf("test", "user"),
		utils.attrConf("test", "override")]);
	wiki.addTiddler({
		title: "testPlugin",
		type: "application/json",
		"plugin-type": "plugin",
		text: JSON.stringify(content)});
	wiki.registerPluginTiddlers("plugin");
	wiki.readPluginInfo();
	wiki.unpackPluginTiddlers();
	// Overrides continue to show up as their plugin versions
	test(wiki, "attributes", ["test/user"]);
	test(wiki, "attributes", ["test/plugin", "test/override"], "testPlugin");
});

});
