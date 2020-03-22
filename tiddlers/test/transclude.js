/*\

Tests transcludes.

\*/

var utils = require("test/utils");

function testText(text, expected, options) {
	[text, expected, options] = utils.prepArgs(text, expected, options);
	var results = utils.relink({text: text}, options);
	expect(results.tiddler.fields.text).toEqual(expected);
	return results;
};

function logMessage(toThere, but) {
	var msg = "Renaming 'from here' to '"+toThere+"' in transclusion of tiddler 'test'"
	if (but) {
		msg = "%c" + msg + " %c" + but;
	}
	return msg;
};

// Tests text like testText, but it also checks log message
function testTextAndLog(text, toTitle, expected, but) {
	var msg = logMessage(toTitle, but);
	var results = testText(text, expected, {to: toTitle});
	expect(results.log).toEqual([msg]);
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
	function test(text, expected) {
		testTextAndLog(text, to, expected, "by converting it into a widget");
	}
	test("{{from here}}.", "<$tiddler tiddler='"+to+"'>{{}}</$tiddler>.");
	test("{{||from here}}.", "<$transclude tiddler='"+to+"'/>.");
	test("{{other title||from here}}.", "<$tiddler tiddler='other title'><$transclude tiddler='"+to+"'/></$tiddler>.");
	test("{{from here||Template}}.", "<$tiddler tiddler='"+to+"'>{{||Template}}</$tiddler>.");
	test("{{from here!!field}}.", "<$tiddler tiddler='"+to+"'>{{!!field}}</$tiddler>.");
	test("{{from here##index}}.", "<$tiddler tiddler='"+to+"'>{{##index}}</$tiddler>.");
	// I don't know why anyone would do these, but Relink will manage it.
	//test("{{from here!!field||Template}}.", "<$tiddler tiddler='"+to+"'>{{##index}}</$tiddler>.");
	//test("{{from here##index||Template}}.", "<$tiddler tiddler='"+to+"'>{{##index}}</$tiddler>.");
	test("{{from here||from here}}.", "<$tiddler tiddler='"+to+"'><$transclude tiddler='"+to+"'/></$tiddler>.");

	// preserves block newline whitespace
	test("{{from here}}\nTxt", "<$tiddler tiddler='"+to+"'>{{}}</$tiddler>\nTxt");
	test("{{from here}}\r\nTxt", "<$tiddler tiddler='"+to+"'>{{}}</$tiddler>\r\nTxt");
});

it('unpretty, but the title is unquotable', function() {
	var to = "curly {}";
	var other = "a'\"";
	testTextAndLog("{{"+other+"||from here}}.", to, utils.placeholder(1,other)+"<$tiddler tiddler=<<relink-1>>><$transclude tiddler='"+to+"'/></$tiddler>.", "by converting it into a widget and creating placeholder macros");
});

it('unpretty and unquotable', function() {
	var to = "has {curly} 'apos' \"quotes\"";
	function test(text, expected) {
		testTextAndLog(text, to, expected, "by converting it into a widget and creating placeholder macros");
	}
	test("{{from here}}.", utils.placeholder(1,to)+"<$tiddler tiddler=<<relink-1>>>{{}}</$tiddler>.");
	test("{{||from here}}.", utils.placeholder(1,to)+"<$transclude tiddler=<<relink-1>>/>.");
	test("{{from here||Template}}.", utils.placeholder(1,to)+"<$tiddler tiddler=<<relink-1>>>{{||Template}}</$tiddler>.");
	test("{{from here!!field}}.", utils.placeholder(1,to)+"<$tiddler tiddler=<<relink-1>>>{{!!field}}</$tiddler>.");
	test("{{from here##index}}.", utils.placeholder(1,to)+"<$tiddler tiddler=<<relink-1>>>{{##index}}</$tiddler>.");
	// Strange nonsense syntax we support
	test("{{from here||from here}}.", utils.placeholder(1,to)+"<$tiddler tiddler=<<relink-1>>><$transclude tiddler=<<relink-1>>/></$tiddler>.");
	test("{{from here!!field||Template}}.", utils.placeholder(1,to)+"<$tiddler tiddler=<<relink-1>>>{{!!field||Template}}</$tiddler>.");
	test("{{from here##index||Template}}.", utils.placeholder(1,to)+"<$tiddler tiddler=<<relink-1>>>{{##index||Template}}</$tiddler>.");
	test("{{title##index||from here}}.", utils.placeholder(1,to)+"<$tiddler tiddler=title><$transclude tiddler=<<relink-1>> index=index/></$tiddler>.");
	test("{{title!!field||from here}}.", utils.placeholder(1,to)+"<$tiddler tiddler=title><$transclude tiddler=<<relink-1>> field=field/></$tiddler>.");
	var other = "a'\"";
	var index = "'apos' and \"quotes\"";
	// Double placeholder insanity. What kind of
	// sick pervert names their tiddlers like this?
	test("{{a'\"||from here}}.", utils.placeholder(1,to)+utils.placeholder(2,other)+"<$tiddler tiddler=<<relink-2>>><$transclude tiddler=<<relink-1>>/></$tiddler>.");
	// This case is so preposterous, I'm not sure I even want to cover it.
	test("{{  "+other+"##"+index+"||from here  }}.", utils.placeholder(1,to)+utils.placeholder(2,other)+utils.placeholder("index-1",index)+"<$tiddler tiddler=<<relink-2>>><$transclude tiddler=<<relink-1>> index=<<relink-index-1>>/></$tiddler>.");
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
