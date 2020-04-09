/*\

Tests the occurrences filter.

\*/

var utils = require("test/utils");

function test(fields, expectedArray, extraTiddlers) {
	fromTitle = fields.from || "from";
	var wiki = new $tw.Wiki();
	var tiddler = $tw.utils.extend({title: "test"}, fields);
	wiki.addTiddlers(utils.setupTiddlers());
	wiki.addTiddlers(extraTiddlers || []);
	wiki.addTiddler(tiddler);
	var output = wiki.filterTiddlers("[["+tiddler.title+"]relink:occurrences["+fromTitle+"]]");
	expect(output).toEqual(expectedArray);
};

describe('filter: occurrences', function() {

it("works on empty reports", function() {
	test({text: "This text has no links"}, []);
});

it("transcludes", function() {
	test({text: "Reference {{from}} stuff"}, ["{{}}"]);
	test({text: "{{from||template}}"}, ["{{||template}}"]);
	test({text: "{{other||from}}"}, ["{{other||}}"]);
	test({text: "{{from!!field}}"}, ["{{!!field}}"]);
	test({text: "{{from##index}}"}, ["{{##index}}"]);
	test({text: "{{from!!field||template}}"}, ["{{!!field||template}}"]);

	// Multiples allowed
	test({text: "{{from!!F||from}}"}, ["{{!!F||from}}", "{{from!!F||}}"]);
});

it("prettylinks", function() {
	test({text: "Text [[from]] stuff"}, ["[[from]]"]);
	test({text: "[[Caption|from]]"}, ["[[Caption]]"]);
	// Preserve whitespace. Newlines are illegal, so don't worry about them.
	test({text: "[[Caption |from]]"}, ["[[Caption ]]"]);
});

it("wikiLinks", function() {
	test({text: "Text WikiFrom stuff", from: "WikiFrom"}, ["~WikiFrom"]);
});

it("html", function() {
	test({text: "<$link to='from' />"}, ["<$link to />"]);
	test({text: "<$text text={{from}} />"}, ["<$text text={{}} />"]);
	test({text: "<$text text={{from!!F}} />"}, ["<$text text={{!!F}} />"]);
	test({text: "<$list filter='from' />"}, ["<$list filter />"]);
	test({text: "<$list filter='[tag[from]]' />"}, ['<$list filter="[tag[]]" />']);
	test({text: "<$A ref='from' />"}, ['<$A ref />'],
		[utils.attrConf("$A", "ref", "reference")]);
	test({text: "<$A ref='from!!field' />"}, ['<$A ref="!!field" />'],
		[utils.attrConf("$A", "ref", "reference")]);

	// Macro attributes
	test({text: "\\define test(title)\n<$link to=<<test from>> />"},
	     ["<$link to=<<test title>> />"],
	     [utils.macroConf("test", "title", "title")]);
	test({text: "<$link to=<<test filt: '[tag[from]]'>> />"},
	     ['<$link to=<<test filt: "[tag[]]">> />'],
	     [utils.macroConf("test", "filt", "filter")]);
	test({text: "<$link to=<<test filt: 'from [tag[from]]'>> />"},
	     ['<$link to=<<test filt>> />', '<$link to=<<test filt: "[tag[]]">> />'],
	     [utils.macroConf("test", "filt", "filter")]);

	// Multiples
	test({text: "<$link to='from' tooltip={{from}} />"},
	     ["<$link to />", "<$link tooltip={{}} />"]);
	test({text: "<$text text={{{from [tag[from]]}}} />"},
	     ["<$text text={{{}}} />", "<$text text={{{[tag[]]}}} />"]);
});

it("macrocall", function() {
	function testMacro(text, expected) {
		var def = "\\define test(title, filt, ref, list) stuff\n";
		test({text: def + text}, expected, [
			utils.macroConf("test", "title", "title"),
			utils.macroConf("test", "ref", "reference"),
			utils.macroConf("test", "filt", "filter"),
			utils.macroConf("test", "list", "list")]);
	};
	testMacro("<<test title:from>>", ["<<test title>>"]);
	testMacro("<<test from>>", ["<<test title>>"]);
	testMacro("<<test filt:'[tag[from]]'>>", ['<<test filt: "[tag[]]">>']);
	testMacro("<<test filt:'from'>>", ['<<test filt>>']);
	testMacro("<<test ref:'from'>>", ['<<test ref>>']);
	testMacro("<<test ref:'from##index'>>", ['<<test ref: "##index">>']);
	testMacro("<<test list:'from A B'>>", ['<<test list>>']);

	// Multiples
	testMacro("<<test from filt:'[[from]]'>>", ["<<test title>>", "<<test filt>>"]);
	testMacro("<<test filt:'[list[from]tag[from]]'>>", ['<<test filt: "[list[]]">>', '<<test filt: "[tag[]]">>']);
	testMacro("<<test from>>\n<<test from>>", ["<<test title>>", "<<test title>>"]);
});

it("macrocall when missing definition", function() {
	function testMacro(text, expected) {
		test({text: text}, expected, [
			utils.macroConf("test", "title", "title"),
			utils.macroConf("test", "ref", "reference"),
			utils.macroConf("test", "filt", "filter"),
			utils.macroConf("test", "list", "list")]);
	};
	testMacro("<<test title:from>>", ["<<test title>>"]);
	testMacro("<<test from>>", []);
});

it("images", function() {
	test({text: "[img[from]]"}, ["[img[]]"]);
	test({text: "[img[Caption|from]]"}, ["[img[Caption]]"]);
	// We strip surrounding whitespace because it can include \n.
	test({text: "[img[ Caption |from]]"}, ["[img[Caption]]"]);
	test({text: "[img class={{from}} [else]]"}, ["[img class={{}}]"]);
	test({text: "[img height={{from!!height}} [else]]"}, ["[img height={{!!height}}]"]);
	test({text: "[img height={{{from}}} [else]]"}, ["[img height={{{}}}]"]);
	test({text: "[img height={{{[tag[from]]}}} [else]]"}, ["[img height={{{[tag[]]}}}]"]);
	test({text: "[img height={{{from [tag[from]]}}} [else]]"}, ["[img height={{{}}}]", "[img height={{{[tag[]]}}}]"]);
	// macros as parameters
	test({text: "[img height=<<test title: from>> [else]]"},
	     ["[img height=<<test title>>]"],
	     [utils.macroConf("test", "title", "title")]);
	test({text: "[img height=<<test filt: '[tag[from]]'>> [else]]"},
	     ['[img height=<<test filt: "[tag[]]">>]'],
	     [utils.macroConf("test", "filt", "filter")]);
	test({text: "[img height=<<test F: 'from [tag[from]]'>> [else]]"},
	     ['[img height=<<test F>>]', '[img height=<<test F: "[tag[]]">>]'],
	     [utils.macroConf("test", "F", "filter")]);
	// Both are recorded separately
	test({text: "[img height={{from}} [from]]"},["[img height={{}}]","[img[]]"]);
});

it("filteredtranscludes", function() {
	test({text: "{{{from}}}"}, ["{{{}}}"]);
	test({text: "{{{[tag[from]]}}}"}, ["{{{[tag[]]}}}"]);
	test({text: "{{{from ||template}}}"}, ["{{{||template}}}"]);
	test({text: "{{{[tag[else]] ||from}}}"}, ["{{{[tag[else]] ||}}}"]);
	test({text: "{{{from||from}}}"}, ["{{{||from}}}", "{{{from||}}}"]);
});

it("pragmas", function() {
	test({text: "\\import [tag[from]]\n"}, ["\\import [tag[]]"]);
	test({text: "\\import from\n"}, ["\\import"]);
	test({text: "\\define relink-1() from\n"}, ["\\define relink-1()"]);
	test({text: "\\define relink-filter-1() [tag[from]]\n"}, ["\\define relink-filter-1() [tag[]]"]);
	test({text: "\\define relink-list-1() A from\n"}, ["\\define relink-list-1()"]);
});

it("fields", function() {
	test({"list-after": "from"}, ["list-after"]);
	test({"tags": "A from B"}, ["tags"]);
	test({"list": "A from B"}, ["list"]);

	// Multiple instances within a field are reported only once, this is
	// because Tiddlywiki removes duplicates itself, so we can't even
	// tell with the "list" field. Just got to make sure we're consistent
	// with custom list fields.
	test({"list": "A from B from"}, ["list"]);
	test({"customlist": "A from B from"}, ["customlist"],
		[utils.fieldConf("customlist", "list")]);
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

	// Multiples
	testFilter("from [tag[from]oper{from}]", ["", "[tag[]]", "[oper{}]"]);
});

});
