/*\

Tests macros.

\*/

var utils = require("test/utils");

function testText(text, expected, options) {
	[text, expected, options] = utils.prepArgs(text, expected, options);
	options.wiki.addTiddlers([
		utils.macroConf("test", "Btitle"),
		utils.macroConf("test", "Clist", "list"),
		utils.macroConf("test", "Dref", "reference"),
		{title: "testMacro", tags: "$:/tags/Macro",
		 text: "\\define test(A, Btitle, Clist, Dref) stuff\n"}
	]);
	var results = utils.relink({text: text}, options);
	expect(results.tiddler.fields.text).toEqual(expected);
	return results;
};

describe("macro", function() {

it('argument orders', function() {
	testText("Macro <<test stuff 'from here' '[[from here]]' 'from here!!f'>>.");
	testText("Macro <<test stuff Clist:'[[from here]]' 'from here'>>.");
	testText("Macro <<test Btitle:'from here' stuff '[[from here]]'>>.");
	testText("Macro <<test Dref:'from here!!f' stuff 'from here'>>.");
	testText("Macro <<test Clist:'[[from here]]' stuff 'from here'>>.");
	testText("Macro <<test Dref:'from here!!f' Clist:'[[from here]]' stuff 'from here'>>.");
});

it("doesn't choke if attribute string == macro name", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler(utils.macroConf("jsontiddlers", "filter", "filter"));
	testText("<<jsontiddlers jsontiddlers>>", "<<jsontiddlers to>>",
	         {wiki: wiki, from: "jsontiddlers", to: "to"});
});

it('core javascript macros', function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler(utils.macroConf("jsontiddlers", "filter", "filter"));
	wiki.addTiddler(utils.macroConf("testmodulemacro", "param", "filter"));
	testText("<<jsontiddlers '[title[from here]]'>>", {wiki: wiki});
	// look in macro-module.js for the custom macro module we're calling
	testText("<<testmodulemacro '[title[from here]]'>>", {wiki: wiki});
});

it('whitespace', function() {
	testText("Macro <<test\n  d\n  'from here'\n  '[[from here]]'\n>>.");
	testText("<<test\r\nd\r\n'from here'\r\n'[[from here]]'\r\n>>\r\n");
	testText("Macro <<test Clist   :   '[[from here]]'>>.");
	testText("Macro\n\n<<test stuff 'from here' '[[from here]]'>>\n\n");
});

it('quotation', function() {
	function test(value, quotedOut) {
		testText("<<test Btitle:from>>",
		         "<<test Btitle:"+quotedOut+">>",
		         {from: "from", to: value});
	};
	test("cd", "cd");
	test("c\"\"' ]d", `"""c\"\"' ]d"""`);
	test('c"""\' d', '[[c"""\' d]]');
	test('c"""\' d', '[[c"""\' d]]');
	test('c""" ]d', '\'c""" ]d\'');
});

it('$macrocall', function() {
	testText("<$macrocall $name=test A=stuff Btitle='from here' Clist='[[from here]]' Dref='from here##index' />");
	testText("\n\n<$macrocall $name=test\n\nBtitle='from here'/>\n\n");
});

it('keeps up to date with macro changes', function() {
	var wiki = new $tw.Wiki();
	var t = testText("Macro <<test stuff 'from here'>>.", {wiki: wiki});
	var oldTick = $tw.utils.nextTick;
	try {
		$tw.utils.nextTick = function(fn) {fn()};
		wiki.eventsTriggered = false;
		wiki.addTiddler({ title: "testMacro", tags: "$:/tags/Macro",
			text: "\\define test(Btitle) title is first now\n"});
	} finally {
		$tw.utils.nextTick = oldTick;
	}

	// Btitle is the first argument now. Relink should realize that.
	// DON'T USE testText, because that'll reoverwrite the new testMacro
	t = utils.relink({text: "Macro <<test 'from here'>>."}, {wiki: wiki});
	expect(t.tiddler.fields.text).toEqual("Macro <<test 'to there'>>.");
});

});
