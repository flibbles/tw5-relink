/*\

Tests transcludes.

\*/

var utils = require("test/utils");
var transclude = require("$:/plugins/flibbles/relink/js/relinkoperations/text/wikitext/transclude.js");
var Placeholder = require("$:/plugins/flibbles/relink/js/utils/placeholder.js");

function testText(text, expected, options) {
	[text, expected, options] = utils.prepArgs(text, expected, options);
	var results = utils.relink({text: text}, options);
	expect(results.tiddler.fields.text).toEqual(expected);
	return results;
};

// Tests text like testText, but it also checks log message
function testTextAndLog(text, toTitle, expected, innerBracketStuff) {
	innerBracketStuff = innerBracketStuff || '';
	if (typeof innerBracketStuff === "string") {
		innerBracketStuff = [innerBracketStuff];
	}
	var logs = innerBracketStuff.map((a) => "Renaming 'from here' to '"+toTitle+"' in 'test': {{"+a+"}}");
	var results = testText(text, expected, {to: toTitle});
	expect(results.log).toEqual(logs);
};

describe("transcludes", function() {

it('transcludes', function() {
	testTextAndLog("{{from here}}", "to", "{{to}}");
	testText("Before {{from here}} After")
	testText("Before {{from here!!field}} After")
	testText("Before {{from here##index}} After")
	testText("Before {{from here||template}} After")
	testText("Before {{title||from here}} After")
	testText("Before {{||from here}} After")
	testText("Before {{from here||from here}} After")
	testText("Before\n\n{{from here||template}}\n\nAfter")
	testText("Before\r\n{{from here||template}}\r\nAfter")
	//These ones don't make much sense, but we'll support them.
	testText("Before {{from here!!field||template}} After");
	testText("Before {{from here##index||template}} After");
	testText("Before {{title!!field||from here}} After");
	testText("Before {{title##index||from here}} After");
	testText("{{from here}}", {to: "to!there"});
	testText("{{from here}}", {to: "to#there"});
	//Templates can have ## and !! even though the title cannot
	testText("{{title||from here}}", {to: "to!!there"});
	testText("{{title||from here}}", {to: "to##there"});
});

it('preserves pretty whitespace', function() {
	testText("Before {{  from here  }} After");
	testText("Before {{\nfrom here\n}} After");
	testText("Before {{  from here  ||  from here  }} After");
	testText("Before {{  from here  ||  from here  }} After");
	testText("Before {{  from here!!field  ||  from here  }} After");
	testText("Before {{  from here##index  ||  from here  }} After");
	testText("Before {{||  from here  }} After");
});

it('from titles with curlies', function() {
	// Despite a block rule theoretically being able to parse this,
	// (like it can with filteredtransclude), it doesn't. That's becase
	// the regexp used by the rule disallows ANY '}' no matter what.
	testText("{{has{curls}}}", {from: "has{curls}", ignored: true});
	testText("{{has{curls}}} inline", {from: "has{curls}", ignored: true});
});

it('ignores malformed transcludes', function() {
	testText("{{from here||}}", {ignored: true});
});

it('rightly judges unpretty', function() {
	function testUnpretty(to) {
		testText("{{from here}}.",
		         "<$tiddler tiddler='"+to+"'>{{}}</$tiddler>.",
		         {to: to});
	};
	testUnpretty("has { curly");
	testUnpretty("has !! bangs");
	testUnpretty("has ## hashes");
	testUnpretty("other } curly");
	testUnpretty("bar | bar");
});

it('unpretty (degrades to widget)', function() {
	var to = "curly {}";
	function test(text, expected, bracketStuff) {
		testTextAndLog(text, to, expected, bracketStuff);
	}
	test("{{from here}}.", "<$tiddler tiddler='"+to+"'>{{}}</$tiddler>.");
	test("{{||from here}}.", "<$transclude tiddler='"+to+"'/>.", "||");
	test("{{other title||from here}}.", "<$tiddler tiddler='other title'><$transclude tiddler='"+to+"'/></$tiddler>.", "other title||");
	test("{{from here||Template}}.", "<$tiddler tiddler='"+to+"'>{{||Template}}</$tiddler>.", "||Template");
	test("{{from here!!field}}.", "<$tiddler tiddler='"+to+"'>{{!!field}}</$tiddler>.", "!!field");
	test("{{from here##index}}.", "<$tiddler tiddler='"+to+"'>{{##index}}</$tiddler>.", "##index");
	// I don't know why anyone would do these, but Relink will manage it.
	//test("{{from here!!field||Template}}.", "<$tiddler tiddler='"+to+"'>{{##index}}</$tiddler>.");
	//test("{{from here##index||Template}}.", "<$tiddler tiddler='"+to+"'>{{##index}}</$tiddler>.");
	test("{{from here||from here}}.", "<$tiddler tiddler='"+to+"'><$transclude tiddler='"+to+"'/></$tiddler>.", ["||"+to, to+"||"]);

	// preserves block newline whitespace
	test("{{from here}}\nTxt", "<$tiddler tiddler='"+to+"'>{{}}</$tiddler>\nTxt");
	test("{{from here}}\r\nTxt", "<$tiddler tiddler='"+to+"'>{{}}</$tiddler>\r\nTxt");
});

it('respects \\rules', function() {
	testText("\\rules only transcludeinline\n{{from here}}");
	testText("\\rules only transcludeblock\n{{from here}}");
	testText("\\rules only html\n{{from here}}", {ignored: true});

	function fails(to, text, expected) {
		expected = expected || text;
		var r = testText(text, expected, {to: to, ignored: true});
		expect(r.fails.length).toEqual(1);
	};
	fails("curly {}", "\\rules except html\n{{from here}}");
	fails("curly {}", "\\rules except html\n{{||from here}}");
	fails("curly {}", "\\rules except html\n{{from here||template}}");
	// Tries to placeholder
	var to = "{}' \"";
	fails(to, "\\rules except html\n{{from here}} [[from here]]",
	          "\\rules except html\n{{from here}} [["+to+"]]");
	fails(to, "\\rules except html\n{{||from here}} [[from here]]",
	          "\\rules except html\n{{||from here}} [["+to+"]]");
	fails(to, "\\rules except macrodef\n{{from here}}");
	fails(to, "\\rules except macrodef\n{{||from here}}");
});

it('unpretty, but the title is unquotable', function() {
	var to = "curly {}";
	var other = "a'\"";
	testTextAndLog("{{"+other+"||from here}}.", to, utils.placeholder(1,other)+"<$tiddler tiddler=<<relink-1>>><$transclude tiddler='"+to+"'/></$tiddler>.", other+"||");
});

it('unpretty and unquotable', function() {
	var to = "has {curly} 'apos' \"quotes\"";
	function test(text, expected, bracketStuff) {
		testTextAndLog(text, to, expected, bracketStuff);
	}
	test("{{from here}}.", utils.placeholder(1,to)+"<$tiddler tiddler=<<relink-1>>>{{}}</$tiddler>.");
	test("{{||from here}}.", utils.placeholder(1,to)+"<$transclude tiddler=<<relink-1>>/>.", "||");
	test("{{from here||Template}}.", utils.placeholder(1,to)+"<$tiddler tiddler=<<relink-1>>>{{||Template}}</$tiddler>.", "||Template");
	test("{{from here!!field}}.", utils.placeholder(1,to)+"<$tiddler tiddler=<<relink-1>>>{{!!field}}</$tiddler>.", "!!field");
	test("{{from here##index}}.", utils.placeholder(1,to)+"<$tiddler tiddler=<<relink-1>>>{{##index}}</$tiddler>.", "##index");
	// Strange nonsense syntax we support
	test("{{from here||from here}}.", utils.placeholder(1,to)+"<$tiddler tiddler=<<relink-1>>><$transclude tiddler=<<relink-1>>/></$tiddler>.", ["||"+to, to+"||"]);
	test("{{from here!!field||Template}}.", utils.placeholder(1,to)+"<$tiddler tiddler=<<relink-1>>>{{!!field||Template}}</$tiddler>.", "!!field||Template");
	test("{{from here##index||Template}}.", utils.placeholder(1,to)+"<$tiddler tiddler=<<relink-1>>>{{##index||Template}}</$tiddler>.", "##index||Template");
	test("{{title##index||from here}}.", utils.placeholder(1,to)+"<$tiddler tiddler=title><$transclude tiddler=<<relink-1>> index=index/></$tiddler>.", "title##index||");
	test("{{title!!field||from here}}.", utils.placeholder(1,to)+"<$tiddler tiddler=title><$transclude tiddler=<<relink-1>> field=field/></$tiddler>.", "title!!field||");
	var other = "a'\"";
	var index = "'apos' and \"quotes\"";
	// Double placeholder insanity. What kind of
	// sick pervert names their tiddlers like this?
	test("{{a'\"||from here}}.", utils.placeholder(1,to)+utils.placeholder(2,other)+"<$tiddler tiddler=<<relink-2>>><$transclude tiddler=<<relink-1>>/></$tiddler>.", other+"||");
	// This case is so preposterous, I'm not sure I even want to cover it.
	test("{{  "+other+"##"+index+"||from here  }}.", utils.placeholder(1,to)+utils.placeholder(2,other)+utils.placeholder("index-1",index)+"<$tiddler tiddler=<<relink-2>>><$transclude tiddler=<<relink-1>> index=<<relink-index-1>>/></$tiddler>.", "  "+other+"##"+index+"||");
});

/** This test has to call the makeTemplate function directly because it's
 *  impossible to hit this code path through renaming tiddlers.
 *  When relinking, if both the title and template are unpretty, it's because
 *  they're the same.
 */
it('makeWidget with unpretty title and template', function() {
	function test(ref, template) {
		var options = {wiki: new $tw.Wiki()};
		var wiki = new $tw.Wiki();
		options.placeholder = new Placeholder(options);
		var rtn = transclude.makeTransclude(ref, template, options);
		return options.placeholder.getPreamble() + rtn;
	};
	var output = test({title: "A}}B"}, "C}}D");
	expect(output).toEqual("<$tiddler tiddler=A}}B><$transclude tiddler=C}}D/></$tiddler>");
	output = test({title: "  A}}B  "}, "  C}}D  ");
	expect(output).toEqual("<$tiddler tiddler=A}}B><$transclude tiddler=C}}D/></$tiddler>");
	output = test({title: "  A}}B  ", field: "F"}, "  C}}D  ");
	expect(output).toEqual("<$tiddler tiddler=A}}B><$transclude tiddler=C}}D field=F/></$tiddler>");
	var title =  " A}} 'B\" ";
	var template =  " C}} 'D\" ";
	output = test({title: title}, template);
	expect(output).toEqual(
		utils.placeholder(1, $tw.utils.trim(template)) +
		utils.placeholder(2, $tw.utils.trim(title)) +
		"<$tiddler tiddler=<<relink-2>>><$transclude tiddler=<<relink-1>>/></$tiddler>");
});

it('transclude obeys rules', function() {
	var block =  "{{from here}}";
	var inline = "Inline {{from here}} inline";
	testText("\\rules except transcludeinline\n"+inline, {ignored: true});
	testText("\\rules except transcludeblock\n"+inline);
	testText("\\rules except transcludeinline\n"+block);
	testText("\\rules except transcludeblock\n"+block);
	testText("\\rules except transcludeinline transcludeblock\n"+block,
	         {ignored: true});
});

});
