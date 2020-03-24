/*\

Tests the occurrences filter.

\*/

var utils = require("test/utils");

function test(fields, expectedArray) {
	var wiki = new $tw.Wiki();
	var tiddler = $tw.utils.extend({title: "test"}, fields);
	wiki.addTiddlers(utils.setupTiddlers());
	wiki.addTiddler(utils.macroConf("test", "title", "title"));
	wiki.addTiddler(utils.macroConf("test", "filter", "filter"));
	wiki.addTiddler(tiddler);
	var output = wiki.filterTiddlers("[[test]relink:occurrences[from]]");
	expect(output).toEqual(expectedArray);
};

describe('filter: occurrences', function() {

it("works", function() {
	test({text: "Text [[from]] stuff"}, ["[[from]]"]);
	test({text: "Reference {{from}} stuff"}, ["{{from}}"]);
	//test({text: "<$link to=from>stuff</$link>"}, ["<$link to=from ..>"]);
	//test({text: "Reference {{other||from}} stuff"}, ["{{||from}}"]);
	//test({list: "A from B"}, ["list: [[from]], .."]);
});

it("html", function() {
	test({text: "<$link to='from' />"}, ["<$link to />"]);
	test({text: "<$link to='from' tooltip={{from}} />"},
	     ["<$link to />", "<$link tooltip />"]);
});

it("macrocall", function() {
	var def = "\\define test(title, filter) stuff\n";
	test({text: def+"<<test title:from>>"}, ["<<test title>>"]);
	test({text: def+"<<test from>>"}, ["<<test title>>"]);
	test({text: def+"<<test from '[[from]]'>>"},
	     ["<<test title>>", "<<test filter>>"]);
	test({text: def+"<<test from>>\n<<test from>>"},
	     ["<<test title>>", "<<test title>>"]);
});

it("fields", function() {
	test({"list-after": "from"}, ["list-after field"]);
	test({"tags": "A from B"}, ["tags"]);
	test({"list": "A from B"}, ["list field"]);
});

});
