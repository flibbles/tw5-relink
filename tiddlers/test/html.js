/*\

Tests widget and HTML element attributes.

\*/

var utils = require("test/utils");

describe("attributes", function() {

function testText(text, expected, options) {
	[text, expected, options] = utils.prepArgs(text, expected, options);
	var results = utils.relink({text: text}, options);
	expect(results.tiddler.fields.text).toEqual(expected);
	return results;
};

it('field attributes', function() {
	var r = testText('<$link to="from here">caption</$link>');
	expect(r.log).toEqual(["Renaming 'from here' to 'to there' in <$link /> element of tiddler 'test'"]);
	testText('<$link to="from here">\n\ncaption</$link>\n\n');
	testText(`<$link to='from here'>caption</$link>`);
	testText(`<$link to='from here' />`);
	testText('Before <$link to="from here">caption</$link> After');
	testText(`<$link tag="div" to="from here">caption</$link>`);
	testText(`<$link aria-label="true" to="from here">caption</$link>`);
	testText(`<$link to='from here'>caption</$link><$link to="from here">another</$link>`);
	testText(`<$link to='from here'>caption</$link>In between content<$link to="from here">another</$link>`);
	testText(`<$link to    =   "from here">caption</$link>`);
	testText("<$link\nto='from here'>caption</$link>");
	testText("<$link to='from here'\n/>");
	testText("<$link\ntag='div'\nto='from here'>caption</$link>");
	testText("<$link\n\ttag='div'\n\tto='from here'>caption</$link>");
	testText(`Begin text <$link to="from here">caption</$link> ending`);
	// Ensure slashes are enclosed in quotes. Important, because macros
	// don't do this.
	testText("<$link to=from />", "<$link to='to/there' />", {from: "from", to: "to/there"});
	// extra tricky
	testText(`<$link tooltip="link -> dest" to="from here" />`);
	// ignores
	testText(`<$link >to="from here"</$link>`, {ignored: true});
	testText(`<$link to="from here"`, {ignored: true});
	testText(`<$LINK to="from here" />`, {ignored: true});
	testText(`<$link TO="from here" />`, {ignored: true});
	testText(`<$link to=<<from>> />`, {from: "from", ignored: true});
});

it('respects \\rules', function() {
	// allowed
	testText("\\rules except macrodef\n<$link to='from here'/>");
	testText("\\rules only html\n<$link to='from here'/>");
	// forbidden
	testText("\\rules except html\n<$link to='from here'/>", {ignored: true});
	testText("\\rules only macrodef\n<$link to='from here'/>", {ignored: true});
});


it('properly ignored when not to be relinked', function() {
	testText(`<$link to="from here XXX" />`, {ignored: true});
	testText(`<$link to={{index!!from here}} />`, {ignored: true});
	testText(`<$link to={{{[get[from here]]}}} />`, {ignored: true});
	testText(`<$link to=<<from here>> />`, {ignored: true});
});

it('field attributes with true', function() {
	testText(`<$link trueAttr to="from here">caption</$link>`);
	testText(`<$link to />`);
	testText(`<$link to />`, {from: "true"});
	testText(`<$link to/> <$link to=true/>`, `<$link to/> <$link to='to there'/>`, {from: "true"});
	testText(`<$link to /> <$link to=true />`, `<$link to /> <$link to='to there' />`, {from: "true"});
	testText(`<$link to       /> <$link to=true />`, `<$link to       /> <$link to='to there' />`, {from: "true"});
});

it('field attributes fun with quotes', function() {
	function testQuote(from, to, options) {
		testText(`<$link to=${from}/>`, `<$link to=${to}/>`, options);
	};
	testQuote(`"""from here"""`, `"""to there"""`);
	testQuote(`from`, `'to there'`, {from: "from"});
	testQuote(`from`, `"Jenny's"`, {from: "from", to: "Jenny's"});
	testQuote(`'"good" boy'`, `"cat's"`, {from: '"good" boy', to: "cat's"});
	testQuote(`"""from here"""`, `'love """ hate'`, {to: 'love """ hate'});

	// It prefers quoteless when given quoteless, but only when possible.
	testQuote(`love`, `hate`, {from: "love", to: "hate"});
	testQuote(`love`, `"lover's"`, {from: "love", to: "lover's"});
	$tw.utils.each('= <>/"\n\t', function(ch) {
		testQuote(`A`, `'te${ch}st'`, {from: "A", to: `te${ch}st`});
	});

	// Now for the super advanced quotes!! //
	testQuote("from", `""""begins" with quote; has apos'"""`, {from: "from", to: `"begins" with quote; has apos'`});
	// The brackets here should be considered part of the title
	// This differs from how macro parameters behave
	testQuote("[[from]]", "to", {from: "[[from]]", to: "to"});
	testQuote("[[from]]", "[[from]]", {from: "from", to: "to"});
});

it('supports indirect attribute values', function() {
	testText("<$link to={{from here}}/>");
	testText("<$link to={{from here!!field}}/>");
	testText("<$link to={{from here##index}}/>");
	testText("<$link to   =   {{from here!!field}} />");
	// Works on otherwise unmanaged attributes too
	var r = testText("<$text text={{from here!!field}} />");
	var to = "title}withBracket";
	var options = {to: to, ignored: true};
	var results = testText("<$link to={{from here}} />", options);
	expect(results.fails.length).toEqual(1);
});

it('allows redirect with bad toTitle if not applicable', function() {
	var to = "title}withBracket";
	// Relink used to fail processing {{thing}} because of an illegal
	// toTitle for references, but it shouldn't fail since no replacement
	// will actually occur.
	var r = testText("<$link tag={{thing}} to='from here' />", {to: to});
	expect(r.fails.length).toEqual(0);
});

it('fails on bad indirect attributes', function() {
	var r;
	r = testText("<$link tooltip={{from here}} to='from here'/>",
	             "<$link tooltip={{from here}} to='E!!E'/>", {to: "E!!E"});
	expect(r.fails.length).toEqual(1);
	r = testText("<$link tooltip={{from here}} to='from here'/>",
	             "<$link tooltip={{from here}} to='T##T'/>", {to: "T##T"});
	expect(r.fails.length).toEqual(1);
});

it("handles failure on special operands that fail internally", function() {
	// This was returning {{{undefined}}} in v1.10.0
	var r;
	r = testText("<$a b={{{[c{from here}]}}} />",
	             "<$a b={{{[c{from here}]}}} />", {to: "E}}E"});
	expect(r.fails.length).toEqual(1);
	var wiki = new $tw.Wiki();
	wiki.addTiddler(utils.macroConf("t", "arg", "reference"));
	r = testText("<$a b=<<t arg:'from here'>> />",
	             "<$a b=<<t arg:'from here'>> />", {to: "E!!E", wiki:wiki});
	expect(r.fails.length).toEqual(1);
});

it("failure doesn't prevent other relinks", function() {
	var r = testText("<$link tooltip={{from here}} to='from here' />",
	                 "<$link tooltip={{from here}} to='to}there' />",
	                 {to: "to}there"});
	expect(r.fails.length).toEqual(1);
	var r = testText("<$link tooltip={{{[r{from here}]}}} to='from here' />",
	                 "<$link tooltip={{{[r{from here}]}}} to='A}}}B' />",
	                 {to: "A}}}B"});
	expect(r.fails.length).toEqual(1);
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([utils.macroConf("t", "arg"),
		{title: "m", tags: "$:/tags/Macro", text: "\\define t(arg)"}]);
	var r = testText("<$link to=<<t 'from here'>>/> [[from here]]",
	                 "<$link to=<<t 'from here'>>/> [[A' B]\"]]",
	                 {to: "A' B]\"", wiki: wiki});
	expect(r.fails.length).toEqual(1);
});

it('supports filter attribute values', function() {
	testText("<$link to={{{[[from here]]}}}/>");
	testText("<$link to=   {{{[[from here]]}}}    />");
	testText("<$link to={{{[[from here]]}}}/>", {to: "to {}there"});
});

it('placeholders bad names in filtered attribute values', function() {
	var ph = utils.placeholder;
	var to = "brack}}}s";
	testText("<$w a={{{from}}}/>", ph(1,to) + "<$w a={{{[<relink-1>]}}}/>",
	         {from: "from", to: to});
	testText("<$w a={{{[tag[from]]}}}/>", ph(1,to) + "<$w a={{{[tag<relink-1>]}}}/>",
	         {from: "from", to: to});
});

it('uses macros for literally unquotable titles', function() {
	var macro = utils.placeholder;
	function link(number) {
		return `<$link to=<<relink-${number||1}>>/>`;
	};
	var to = 'End\'s with "quotes"';
	var to2 = 'Another\'"quotes"';
	var expectedLink = '<$link to=<<relink-1>>/>';
	var r = testText("<$link to='from here'/>", macro(1,to)+link(1), {to: to});
	expect(r.log).toEqual(["Renaming 'from here' to '"+to+"' in <$link /> element of tiddler 'test'"]);
	testText("Before <$link to='from here'/> After",
	         macro(1,to)+"Before "+link(1)+" After", {to: to});
	// It'll prefer triple-quotes, but it should still resort to macros.
	testText('<$link to="""from here"""/>', macro(1,to)+link(1), {to: to});
	// Only one macro is made, even when multiple instances occur
	testText("<$link to='from here'/><$link to='from here'/>",
		 macro(1,to)+link(1)+link(1), {to: to});
	// If the first placeholder is taken, take the next
	testText(macro(1,to)+link(1)+"<$link to='from here'/>",
	         macro(2,to2)+macro(1,to)+link(1)+link(2), {to: to2});
});

it("doesn't use macros if forbidden by \\rules", function() {
	var r = testText('\\rules except macrodef\n<$link to="from here"/>',
	                 {ignored: true, to: "x' y\""});
	expect(r.fails.length).toEqual(1);
});

it('uses macros for unquotable wikitext', function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler(utils.attrConf("$test", "wiki", "wikitext"));
	var ph = utils.placeholder;

	var to = "' ]]\"\"\"";
	testText("B <$test wiki='X{{from here}}Y' />",
	         ph("wikitext-1", "X{{"+to+"}}Y")+"B <$test wiki=<<relink-wikitext-1>> />",
	         {to: to, wiki: wiki});

	to = "' ]]\"";
	testText('A <$test wiki="""<$link to="from here" />""" /> B',
	         ph(1, to)+'A <$test wiki="""<$link to=<<relink-1>> />""" /> B',
	         {to: to, wiki: wiki});
});

it('detects when internal list uses macros', function() {
	var to = "bad[]name";
	var r = testText("<$list filter='[tag[from here]]'/>",
	                 utils.placeholder(1,to)+"<$list filter='[tag<relink-1>]'/>",
	                 {to: to});
	expect(r.log).toEqual(["Renaming 'from here' to '"+to+"' in <$list /> element of tiddler 'test'"]);
});

it('ignores blank attribute configurations', function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers(utils.attrConf("$transclude", "tiddler", ""));
	testText(`<$link to="A" /><$transclude tiddler="A" />`,
	         `<$link to="to there" /><$transclude tiddler="A" />`,
	         {wiki: wiki, from: "A"});
});

it('ignores unrecognized attribute configurations', function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler(utils.attrConf("$transclude", "tiddler", "kablam"));
	testText(`<$link to="A" /><$transclude tiddler="A" />`,
	         `<$link to="to there" /><$transclude tiddler="A" />`,
	         {wiki: wiki, from: "A"});
});

/**This is legacy support. The 'title' field type used to be called 'field'
 * But field didn't make sense in many contexts.
 */
it('supports "field" attribute configuration', function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler(utils.attrConf("$transclude", "tiddler", "field"));
	testText(`<$transclude tiddler="from here" />`, {wiki: wiki});
});

it('filter attributes', function() {
	var wiki = new $tw.Wiki();
	testText(`<$list filter="A [[from here]] B" />`, {wiki: wiki});
	testText(`<$list nothing="A [[from here]] B" />`, {wiki: wiki, ignored: true});
});

it('mixed failure with string and reference attributes', function() {
	// Regression test on bug which resulted from the output value of the
	// first attribute bleeding into the second if the second fails.
	testText("<$link to='from here' tooltip={{from here}} />",
	         "<$link to='to}}there' tooltip={{from here}} />",
	         {to: "to}}there", fails: 1});
});

});
