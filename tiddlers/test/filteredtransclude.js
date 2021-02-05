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

function logMessage(toThere, innerBracketStuff) {
	innerBracketStuff = innerBracketStuff || '';
	return "Renaming 'from here' to '"+toThere+"' in 'test': {{{"+innerBracketStuff+"}}}";
};

describe("filtered transcludes", function() {

it('pretty', function() {
	var r = testText("{{{[[from here]]}}}");
	expect(r.log).toEqual([logMessage("to there")]);
	testText("Inline {{{[[from here]]}}} List");
	testText("Block\n\n{{{[[from here]]}}}\n\nList");
	testText("Block\n{{{[[from here]]}}}.class\nList");
	testText("Block\r\n{{{[[from here]]}}}\r\nList");
	testText("{{{[[from here]]|tooltip}}}");
	testText("{{{[[from here]]||Template}}}");
	testText("{{{[[from here]]||from here}}}");
	testText("{{{[[title]]||from here}}}");
	testText("{{{[[from here]]|tooltip||Template}}}");
	testText("{{{[[from here]]|tooltip||Template}}}.class.class");
	testText("{{{[[from here]]|tooltip||Template}}width:40;}.class.class");
	// tricky titles
	testText("{{{[[from here]]}}}", {to: "to } there"});
});

it('respects rules', function() {
	testText("\\rules only filteredtranscludeinline\n{{{[[from here]]}}}");
	testText("\\rules only filteredtranscludeblock\n{{{[[from here]]}}}");
	testText("\\rules except macrodef html\n{{{[[from here]]}}}");
});

it('from titles with curlies', function() {
	testText("{{{has{curls}}}}", {from: "has{curls}", to: "there"});
	testText("{{{has{curls}}}}}}", {from: "has{curls}}}", to: "there"});
	// Inline rule won't match this correctly, so we shouldn't either.
	testText("{{{has{curls}}}} inline", {from: "has{curls}",ignored: true});
});

it('preserves pretty whitespace', function() {
	testText("{{{   [[from here]]   }}}");
	testText("{{{   [[from here]]   ||  Template  }}}");
	testText("{{{   [[from here]]   ||  from here  }}}");
});

it('pretty but tricky', function() {
	// This doesn't have to become unpretty if it's considered as a block,
	// since the block parser goes to the end of the line and therefor
	// correctly parses the curly braces.
	// However, it's too much work to test for, so just downgrade it.
	testText("{{{from}}} inline", "{{{[[closecurly}]]}}} inline",
	         {from: "from", to: "closecurly}"});
	// If it's not at the end though, it's not as big of a deal
	testText("{{{from}}} inline", "{{{close}curly}}} inline",
	         {from: "from", to: "close}curly"});
});

it('prefers widget or placeholder', function() {
	// If filtered transclude uses the parseInBraces method, then the filter
	// will make a placeholder so that it can be contained in braces, but
	// that's more drastic than just downgrading to a list.
	testText("{{{from}}}", "<$list filter=to}}}here/>", {from: "from", to: "to}}}here"});
});

it('rightly judges unpretty', function() {
	function testUnpretty(to) {
		testText("Test: {{{from}}} inline",
		         "Test: <$list filter="+to+"/> inline",
		         {from: "from", to: to});
	};
	// Two curlies seems like an odd number, but it's what the inline rule
	// looks for since after two, it may include that width information
	// This WOULD work if it wasn't a filtered transclude.
	testUnpretty("Curly}}Closers");
	testUnpretty("Bars|Bars");
});

it('unpretty (degrades to widget)', function() {
	function test(to, text, expected, innerBracket) {
		var results = testText(text, expected, {to: to});
		var message = logMessage(to, innerBracket);
		expect(results.log).toEqual([message]);
	};
	test("bar|here", "{{{[[from here]]}}}", "<$list filter=bar|here/>");
	test("bar|here", "{{{[[from here]]}}}", "<$list filter=bar|here/>");
	test("bar|","{{{A||from here}}}","<$list filter=A template=bar|/>", "A||");
	test("cur}","{{{A||from here}}}","<$list filter=A template=cur}/>", "A||");
	test("cur{","{{{A||from here}}}","<$list filter=A template=cur{/>", "A||");
	test("bar|", "{{{[[from here]]|tooltip||Template}}width:50;}.A.B",
	             "<$list filter=bar| tooltip=tooltip template=Template style=width:50; itemClass='A B'/>", "||Template");

	// preserves block newline whitespace
	test("A|B", "{{{[[from here]]}}}\nTxt", "<$list filter=A|B/>\nTxt");
	test("A|B", "{{{[[from here]]}}}\r\nTxt", "<$list filter=A|B/>\r\nTxt");

	// respects \rules
	function testRules(rules) {
		test("bar|here", rules+"{{{[[from here]]}}}", rules+"<$list filter=bar|here/>");
	};
	testRules("\\rules except macrodef\n");
	testRules("\\rules only html filteredtranscludeinline filteredtranscludeblock\n");
	testRules("\\rules only html filteredtranscludeinline\n");
	testRules("\\rules only html filteredtranscludeblock\n");
});

it('unpretty (\\rules prohibit widgets)', function() {
	function test(rules) {
		var r = testText(rules + "{{{[[from here]]}}}", {ignored: true, to: "b|h"});
		expect(r.fails.length).toEqual(1);
	};
	test("\\rules except html\n");
	test("\\rules only macrodef filteredtranscludeblock\n");
});

it('unpretty and unquotable', function() {
	var ph = utils.placeholder;
	function test(to, text, expected) {
		var message = message;
		var results = testText(text, expected, {to: to});
	};
	var weird = 'a\'|" """x';
	//test(`{{{[[""""'']] [[from here]]}}}`
	//test(weird, `{{{[[from here]]}}}`, ph(1,weird) + "<$list filter='[<relink-1>]'");
	test("bad[]title",
	     "{{{[title[from here]]}}}",
	     ph(1, "bad[]title")+"{{{[title<relink-1>]}}}");
	var tooltip = `"tooltips's"`;
	test(weird, "{{{Title||from here}}}", ph(1,weird) + "<$list filter=Title template=<<relink-1>>/>");
	test("bar|bar", "{{{Title|"+tooltip+"||from here}}}", ph("tooltip-1",tooltip) + "<$list filter=Title tooltip=<<relink-tooltip-1>> template=bar|bar/>");
});

it("reports", function() {
	function test(text, expected) {
		var wiki = new $tw.Wiki();
		wiki.addTiddler({title: 'test', text: text});
		wiki.addTiddlers(utils.setupTiddlers());
		var refs = wiki.getTiddlerRelinkReferences('test');
		expect(refs).toEqual(expected);
	};
	test("content here {{{from}}} content there", {from: ["{{{}}}"]});
	test("{{{\n[enlist[1]]\n[tag[from]]\n[enlist[2]]}}}", {from: ["{{{[tag[]]}}}"]});
	test("{{{  from\n||\ntemplate  }}}", {from: ["{{{||template}}}"], template: ["{{{from||}}}"]});
	test("{{{[tag[else]]\r\n[enlist[1]] ||from}}}", {else: ["{{{[tag[]]||from}}}"], from: ["{{{[tag[else]] [enlist[1]]||}}}"]});
	test("{{{from||from}}}", {from: ["{{{||from}}}", "{{{from||}}}"]});
});

});
