/*\

Tests transcludes.

\*/

var utils = require("test/utils");

function testText(text, expected, report, options) {
	options = Object.assign({from: 'from here', to: 'to there'}, options);
	const wiki = options.wiki || new $tw.Wiki();
	if (expected === true) {
		expected = text.split(options.from).join(options.to);
	} else if (expected === false) {
		expected = text;
	}
	wiki.addTiddlers([
		{title: 'test', text: text},
		utils.operatorConf("title")]);
	expect(utils.getReport('test', wiki)[options.from]).toEqual(report);
	wiki.renameTiddler(options.from, options.to, options);
	expect(utils.getText('test', wiki)).toEqual(expected);
};

function logMessage(toThere) {
	return "Renaming 'from here' to '"+toThere+"' in 'test'";
};

describe("filtered transcludes", function() {

beforeEach(function() {
	spyOn(console, 'log');
});

it('pretty', function() {
	testText("{{{[[from here]]}}}", true, ['{{{}}}']);
	expect(console.log).toHaveBeenCalledWith(logMessage("to there"));
	testText("Inline {{{[[from here]]}}} List", true, ['{{{}}}']);
	testText("Block\n\n{{{[[from here]]}}}\n\nList", true, ['{{{}}}']);
	testText("Block\n{{{[[from here]]}}}.class\nList", true, ['{{{}}}']);
	testText("Block\r\n{{{[[from here]]}}}\r\nList", true, ['{{{}}}']);
	testText("{{{[[from here]]|tooltip}}}", true, ['{{{}}}']);
	testText("{{{[[from here]]||Template}}}", true, ['{{{||Template}}}']);
	testText("{{{[[from here]]||from here}}}", true, ['{{{||from here}}}', '{{{[[from here]]||}}}']);
	testText("{{{[[title]]||from here}}}", true, ['{{{[[title]]||}}}']);
	testText("{{{[[from here]]|tooltip||Template}}}", true, ['{{{||Template}}}']);
	testText("{{{[[from here]]|tooltip||Template}}}.class.class", true, ['{{{||Template}}}']);
	testText("{{{[[from here]]|tooltip||Template}}width:40;}.class.class", true, ['{{{||Template}}}']);
	// tricky titles
	testText("{{{[[from here]]}}}", true, ['{{{}}}'], {to: "to } there"});

	// whitespace
	testText("{{{\n[enlist[1]]\n[tag{from}]\r\n[enlist[2]]}}}", true, ["{{{[tag{}]}}}"], {from: 'from', to: 'to'});
	testText("{{{  from\n||\ntemplate  }}}", true, ['{{{||template}}}'], {from: 'from', to: 'to'});
});

it('respects rules', function() {
	testText("\\rules only filteredtranscludeinline\n{{{[[from here]]}}}", true, ['{{{}}}']);
	testText("\\rules only filteredtranscludeblock\n{{{[[from here]]}}}", true, ['{{{}}}']);
	testText("\\rules except macrodef html\n{{{[[from here]]}}}", true, ['{{{}}}']);
});

it('from titles with curlies', function() {
	testText("{{{has{curls}}}}", true, ['{{{}}}'], {from: "has{curls}", to: "there"});
	testText("{{{has{curls}}}}}}", true, ['{{{}}}'], {from: "has{curls}}}", to: "there"});
	// Inline rule won't match this correctly, so we shouldn't either.
	testText("{{{has{curls}}}} inline", false, undefined, {from: "has{curls}"});
});

it('preserves pretty whitespace', function() {
	testText("{{{   [[from here]]   }}}", true, ['{{{}}}']);
	testText("{{{   [[from here]]   ||  Template  }}}", true, ['{{{||Template}}}']);
	testText("{{{   [[from here]]   ||  from here  }}}", true, ['{{{||from here}}}', '{{{[[from here]]||}}}']);
});

it('pretty but tricky', function() {
	// This doesn't have to become unpretty if it's considered as a block,
	// since the block parser goes to the end of the line and therefor
	// correctly parses the curly braces.
	// However, it's too much work to test for, so just downgrade it.
	testText("{{{from}}} inline", "{{{[[closecurly}]]}}} inline", ['{{{}}}'],
	         {from: "from", to: "closecurly}"});
	// If it's not at the end though, it's not as big of a deal
	testText("{{{from}}} inline", "{{{close}curly}}} inline", ['{{{}}}'],
	         {from: "from", to: "close}curly"});
});

it('prefers widget or placeholder', function() {
	// If filtered transclude uses the parseInBraces method, then the filter
	// will make a placeholder so that it can be contained in braces, but
	// that's more drastic than just downgrading to a list.
	testText("{{{from}}}", "<$list filter=to}}}here/>", ['{{{}}}'], {from: "from", to: "to}}}here"});
});

it('rightly judges unpretty', function() {
	function testUnpretty(to) {
		testText("Test: {{{from}}} inline",
		         "Test: <$list filter="+to+"/> inline",
		         ['{{{}}}'],
		         {from: "from", to: to});
	};
	// Two curlies seems like an odd number, but it's what the inline rule
	// looks for since after two, it may include that width information
	// This WOULD work if it wasn't a filtered transclude.
	testUnpretty("Curly}}Closers");
	testUnpretty("Bars|Bars");
});

it('unpretty (degrades to widget)', function() {
	testText("{{{[[from here]]}}}", "<$list filter=bar|here/>", ['{{{}}}'], {to: "bar|here"});
	testText("{{{[[from here]]}}}", "<$list filter=bar|here/>", ['{{{}}}'], {to: "bar|here"});
	testText("{{{A||from here}}}","<$list filter=A template=bar|/>", ['{{{A||}}}'], {to: "bar|"});
	testText("{{{A||from here}}}","<$list filter=A template=cur}/>", ['{{{A||}}}'], {to: "cur}"});
	testText("{{{A||from here}}}","<$list filter=A template=cur{/>", ['{{{A||}}}'], {to: "cur{"});
	testText("{{{[[from here]]|tooltip||Template}}width:50;}.A.B",
	         "<$list filter=bar| tooltip=tooltip template=Template style=width:50; itemClass='A B'/>", ['{{{||Template}}}'], {to: 'bar|'});

	// preserves block newline whitespace
	testText("{{{[[from here]]}}}\nTxt", "<$list filter=A|B/>\nTxt", ['{{{}}}'], {to: 'A|B'});
	testText("{{{[[from here]]}}}\r\nTxt", "<$list filter=A|B/>\r\nTxt", ['{{{}}}'], {to: 'A|B'});

	// respects \rules
	function testRules(rules) {
		testText(rules+"{{{[[from here]]}}}", rules+"<$list filter=bar|here/>", ['{{{}}}'], {to: 'bar|here'});
	};
	testRules("\\rules except macrodef\n");
	testRules("\\rules only html filteredtranscludeinline filteredtranscludeblock\n");
	testRules("\\rules only html filteredtranscludeinline\n");
	testRules("\\rules only html filteredtranscludeblock\n");
});

it('unpretty (\\rules prohibit widgets)', function() {
	function test(rules) {
		const fails = utils.collectFailures(function() {
			testText(rules + "{{{[[from here]]}}}", false, ['{{{}}}'], {to: "b|h"});
		});
		expect(fails.length).toEqual(1);
	};
	test("\\rules except html\n");
	test("\\rules only macrodef filteredtranscludeblock\n");
});

it('unpretty and unquotable', function() {
	var ph = utils.placeholder;
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		utils.attrConf('$list', 'template'),
		utils.attrConf('$list', 'filter', 'filter')]);
	var weird = 'a\'|" """x';
	// This test is commented out because I'm not sure I want this to be the
	// expected behavior. It seems like it'd be cleaner to placeholder the
	// title inside of the filter rather than placeholdering the entire filter.
	//testText(`{{{[[from here]]}}}`, ph(1,weird) + "<$list filter='[<relink-1>]'/>", ['{{{}}}'], {to: weird, wiki: wiki});
	testText("{{{[title[from here]]}}}",
	         ph(1, "bad[]title")+"{{{[title<relink-1>]}}}",
	         ['{{{[title[]]}}}'], {to: 'bad[]title', wiki: wiki});
	var tooltip = `"tooltips's"`;
	testText("{{{Title||from here}}}", ph(1,weird) + "<$list filter=Title template=<<relink-1>>/>", ['{{{Title||}}}'], {to: weird, wiki: wiki});
	testText("{{{Title|"+tooltip+"||from here}}}", ph("plaintext-1",tooltip) + "<$list filter=Title tooltip=<<relink-plaintext-1>> template=bar|bar/>", ['{{{Title||}}}'], {to: 'bar|bar', wiki: wiki});
});

});
