/*\

Tests the report filter.

\*/

var utils = require("test/utils");

function test(fields, expectedArray, extraTiddlers) {
	fromTitle = fields.from || "from";
	var wiki = new $tw.Wiki();
	var tiddler = $tw.utils.extend({title: "test"}, fields);
	wiki.addTiddlers(utils.setupTiddlers());
	wiki.addTiddlers(extraTiddlers || []);
	wiki.addTiddler(tiddler);
	var output = wiki.filterTiddlers("[["+tiddler.title+"]relink:report["+fromTitle+"]]");
	expect(output).toEqual(expectedArray);
};

describe('filter: report', function() {

it("works on empty reports", function() {
	test({text: "This text has no links"}, []);
});

it("syslinks", function() {
	test({text: "Text $:/sys/link stuff", from: "$:/sys/link"},
	     ["~$:/sys/link"]);
});

it("filter fields", function() {
	test({"filter": "A from"}, ["filter"]);
	test({"filter": "A [tag[from]]"}, ["filter: [tag[]]"]);
	// Duplicates are allowed
	test({"filter": "A from B from"}, ["filter", "filter"]);
	test({"filter": "from [tag[from]]"}, ["filter","filter: [tag[]]"]);
});

it("filter tiddlers", function() {
	test({type: "text/x-tiddler-filter", text: "[tag[from]]"}, ["[tag[]]"]);
	// This is the only case where a report string may be empty
	test({type: "text/x-tiddler-filter", text: "from"}, [""]);
	// Multiples
	test({type: "text/x-tiddler-filter", text: "from [tag[from]]"}, ["", "[tag[]]"]);
	// Also, make sure $:/DefaultTiddlers works.
	test({title: "$:/DefaultTiddlers", text: "[tag[from]]"}, ["[tag[]]"]);
});

it("filters", function() {
	function testFilter(text, expected, extraTiddlers) {
		test({type: "text/x-tiddler-filter", text: text}, expected, extraTiddlers);
	};
	// Variations of title
	testFilter("[[from]]", [""]);
	testFilter("[{from}]", ["[title{}]"]);
	testFilter("from", [""]);
	testFilter("'from'", [""]);
	testFilter('"from"', [""]);
	testFilter("[title[from]]", ["[title[]]"]);
	testFilter("[field:title[from]]", ["[field:title[]]"]);
	testFilter("[[from]tag[something]]", ["[title[]]"]);

	// Suffixes and Prefixes
	testFilter("[!tag[from]]", ["[!tag[]]"]);
	testFilter("[tag:suffix[from]]", ["[tag:suffix[]]"]);

	//Indirect parameters
	testFilter("[something{from}]", ["[something{}]"]);
	testFilter("[something{from!!f}]", ["[something{!!f}]"]);
	testFilter("[something{from##i}]", ["[something{##i}]"]);

	// Different operand types
	testFilter("[list[from]]", ["[list[]]"]);
	testFilter("[list[from##i]]", ["[list[##i]]"]);
	testFilter("[enlist[A from B]]", ["[enlist[]]"],
	           [utils.operatorConf("enlist", "list")]);
	testFilter("[filt[from]]", ["[filt[]]"],
	           [utils.operatorConf("filt", "filter")]);
	testFilter("[wiki[{{from!!field}}]]", ["[wiki[{{!!field}}]]"],
	           [utils.operatorConf("wiki", "wikitext")]);

	// Multiples
	testFilter("from [tag[from]oper{from}]", ["", "[tag[]]", "[oper{}]"]);

	// BUG: Doesn't report for any operators later in a run
	testFilter("[tag[from]something[else]]", ["[tag[]]"]);
});

});
