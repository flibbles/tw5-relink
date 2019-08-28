/*\

Tests transcludes.

\*/

var utils = require("test/utils");

function testText(text, expected, options) {
	[text, expected, options] = utils.prepArgs(text, expected, options);
	var t = utils.relink({text: text}, options);
	expect(t.fields.text).toEqual(expected);
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
	var log = [];
	testText(text, expected, {to: toTitle, log: log});
	expect(log).toEqual([msg]);
};

describe("prettylink", function() {

it('transcludes', function() {
	var log = [];
	testText("{{from here}}", {log: log})
	expect(log).toEqual([logMessage("to there")]);
	testText("Before {{from here}} After")
	testText("Before {{from here!!field}} After", {debug: true})
	testText("Before {{from here##index}} After")
	testText("Before {{from here||template}} After")
	testText("Before {{title||from here}} After")
	testText("Before {{||from here}} After")
	testText("Before {{from here||from here}} After")
	testText("Before\n\n{{from here||template}}\n\nAfter")
	//These ones don't make much sense, but we'll support them.
	testText("Before {{from here!!field||template}} After");
	testText("Before {{from here##index||template}} After");
	testText("Before {{title!!field||from here}} After");
	testText("Before {{title##index||from here}} After");
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

it('rightly judges unpretty', function() {
	function testUnpretty(to) {
		testText("{{from here}}.",
		         "<$tiddler tiddler='"+to+"'>{{}}</$tiddler>.",
		         {to: to});
	};
	testUnpretty("has { curly");
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
	test("{{title##index||from here}}.", utils.placeholder(1,to)+"<$tiddler tiddler=title><$transclude tiddler=<<relink-1>> index='index'/></$tiddler>.");
	test("{{title!!field||from here}}.", utils.placeholder(1,to)+"<$tiddler tiddler=title><$transclude tiddler=<<relink-1>> field='field'/></$tiddler>.");
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
