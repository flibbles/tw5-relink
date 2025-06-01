/*\

Tests placeholder macros which were previously created by relink.
E.G.

\define relink-1() ...
\define relink-filter-3() ...

\*/

var utils = require("./utils");

function testText(text, expected, report, options) {
	options = Object.assign({from: 'from here', to: 'to there'}, options);
	const wiki = options.wiki || new $tw.Wiki();
	if (expected === true) {
		expected = text.split(options.from).join(options.to);
	} else if (expected === false) {
		expected = text;
	}
	wiki.addTiddler({title: 'test', text: text});
	expect(utils.getReport('test', wiki)[options.from]).toEqual(report);
	wiki.renameTiddler(options.from, options.to, options);
	expect(utils.getText('test', wiki)).toEqual(expected);
};

/**Returns the placeholder pragma
 *
 * There are times when Relink can't relink in place, so it has to resort
 * to using macros. This is the macro pattern.
 */
function macro(number, value, multiline, newline) {
	newline = newline || '\n'
	if (multiline) {
		return `\\define relink-${number}()${newline}${value}${newline}\\end${newline}`;
	} else {
		return `\\define relink-${number}() ${value}${newline}`;
	}
};

describe("placeholders", function() {

beforeEach(function() {
	spyOn(console, 'log');
});

it('executes and logs', function() {
	var from = 'End\'s with "quotes"';
	var to = 'Another\'"quotes"';
	var content = "Anything goes here";
	// placeholders get replaced too
	testText(macro(1,from)+content, true, ['\\define relink-1()'], {from: from, to: to});
	expect(console.log).toHaveBeenCalledWith(`Renaming '${from}' to '${to}' in 'test'`);
});

it('filter', function() {
	// Works with the filter placeholders
	const report = ['\\define relink-filter-1()'];
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.operatorConf('title'));
	testText(macro("filter-1","[title[from here]]")+"Tiddler body", true, report, {wiki: wiki});
	expect(console.log).toHaveBeenCalledWith("Renaming 'from here' to 'to there' in 'test'");
});

it('list', function() {
	// Works with the list placeholders
	testText(macro("list-1","A [[from here]] B")+"Tiddler body", true, ['\\define relink-list-1()']);
});

it('reference', function() {
	// Works with reference placeholders
	testText(macro("reference-1","from here!!field")+"Tiddler body", true, ['\\define relink-reference-1() !!field']);
});

it('wikitext', function() {
	// Works with wikitext placeholders
	testText(macro("wikitext-1", "pretty [[from here]] link")+"Body", true, ['\\define relink-wikitext-1() [[from here]]']);
});

it('plaintext', function() {
	// Is allowed, but completely ignored
	var m = macro("text-1", "from [[from]] {{from}}");
	testText(m+"[[from]]", m+"[[to there]]", ['[[from]]'], {from: "from"});
});

it('preserves & ignores correct whitespace', function() {
	testText(macro(1, "   from here"), true, ['\\define relink-1()']);
	testText(macro(1, "\tfrom here"), true, ['\\define relink-1()']);
	// no space
	testText("\\define relink-1()from here\n", true, ['\\define relink-1()']);
	// spaces along definition
	testText("\\define    relink-1() from here", true, ['\\define relink-1()']);
	testText("\\define relink-1(    ) from here", true, ['\\define relink-1()']);
	// space at the end goes into the variable actually
	testText(macro(1, "from here "), false, undefined);
	testText(macro(1, "from here\t"), false, undefined);
});

it('does not crash when given invalid category', function() {
	// Instead, it's just treated as wikitext
	testText(macro("wrong-1", "[[from here]]")+"[[from here]]",
	         macro("wrong-1", "[[from here]]")+"[[to there]]",
	         ['[[from here]]']);
});

it("failed relinking properly moves pointer head", function() {
	// The placeholder list will fail to relink. But it could theoretically
	// relink if [[from here]] is enterpreted as text. That's why the parse
	// head must move past it.
	utils.spyFailures(spyOn);
	testText(macro("list-1", "content [[from here]]")+"Body",
			 false, ['\\define relink-list-1()'], {to: "A ]] B"});
	expect(utils.failures).toHaveBeenCalledTimes(1);
});

it("unfound relinking properly moves pointer head", function() {
	// This will fail to find a reference to relink, so the placeholder value
	// should be skipped. But if the head isn't moved past it, [[from here]]
	// will parse as a pretty link.
	testText(macro("reference-1", "[[from here]]")+"Body", false, undefined);
});

it('Windows newlines', function() {
	// Works with Windows newlines
	testText(macro(1,"from here",false,"\r\n")+"Body content", true, ['\\define relink-1()']);
});

it("block placeholders", function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.operatorConf('tag'));
	testText(macro("filter-1", "[tag[from here]]", true)+"body", true, ['\\define relink-filter-1() [tag[]]'], {wiki: wiki});
	testText(macro("filter-1", "[tag[from here]]", true, "\r\n")+"body", true, ['\\define relink-filter-1() [tag[]]'], {wiki: wiki});
	testText(macro("filter-1", "[tag[from here]]", true).trimEnd(), true, ['\\define relink-filter-1() [tag[]]'], {wiki: wiki});
});

it("block placeholders and whitespace", function() {
	testText(macro(1, "from here", true), true, ['\\define relink-1()']);
	testText(macro(1, " from here", true), false, undefined);
	testText(macro(1, "from here ", true), false, undefined);
	testText(macro(1, "\nfrom here\n", true), false, undefined);
	testText(macro(1, "from here\n", true), false, undefined);
	testText("\\define relink-1()  \nfrom here\n\\end  \ncontent", true, ['\\define relink-1()']);
	testText("\\define relink-1()  \r\nfrom here\r\n\\end  \r\ncontent", true, ['\\define relink-1()']);
});

it("relinks placeholder to empty tiddler body", function() {
	var placeholder = macro(1, "from here").trimEnd();
	testText(placeholder, true, ['\\define relink-1()']);
});

it("placeholders not at front of file are ignored", function() {
	testText("text\n" + macro(1, "from here") + "text", false, undefined);
	testText("text\n" + macro(1, "from here", true) + "text", false, undefined);
});

it("respects \\rules", function() {
	testText("\\rules only macrodef\n" + macro("list-1", "from"), true, ['\\define relink-list-1()'], {from: 'from', to: 'to'});
	testText("\\rules except macrodef\n" + macro("list-1", "from"), false, undefined, {from: 'from'});
});

});
