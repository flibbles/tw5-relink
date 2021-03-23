/*\

Tests widget and HTML element attributes.

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

describe("html", function() {

beforeEach(function() {
	spyOn(console, 'log');
});

it('field attributes', function() {
	const wiki = new $tw.Wiki();
	const options = {wiki: wiki};
	const link = ['<$link to />'];
	wiki.addTiddler(utils.attrConf('$link', 'to'));
	testText('<$link to="from here">caption</$link>', true, link, options);
	expect(console.log).toHaveBeenCalledWith("Renaming 'from here' to 'to there' in 'test'");
	testText('<$link to="from here">\n\ncaption</$link>\n\n', true, link, options);
	testText(`<$link to='from here'>caption</$link>`, true, link, options);
	testText(`<$link to='from here' />`, true, link, options);
	testText('<$link to="from here" tooltip="" />', true, link, options);
	testText('Before <$link to="from here">caption</$link> After', true, link, options);
	testText(`<$link tag="div" to="from here">caption</$link>`, true, link, options);
	testText(`<$link aria-label="true" to="from here">caption</$link>`, true, link, options);
	testText(`<$link to='from here'>caption</$link><$link to="from here">another</$link>`, true, ['<$link to />', '<$link to />'], options);
	testText(`<$link to='from here'>caption</$link>In between content<$link to="from here">another</$link>`, true, ['<$link to />', '<$link to />'], options);
	testText(`<$link to    =   "from here">caption</$link>`, true, link, options);
	testText("<$link\nto='from here'>caption</$link>", true, link, options);
	testText("<$link to='from here'\n/>", true, link, options);
	testText("<$link\ntag='div'\nto='from here'>caption</$link>", true, link, options);
	testText("<$link\n\ttag='div'\n\tto='from here'>caption</$link>", true, link, options);
	testText(`Begin text <$link to="from here">caption</$link> ending`, true, link, options);
	// Ensure slashes are enclosed in quotes. Important, because macros
	// don't do this.
	testText("<$link to=from />", "<$link to='to/there' />", link, {from: "from", to: "to/there", wiki: wiki});
	// extra tricky
	testText(`<$link tooltip="link -> dest" to="from here" />`, true, link, options);

	// ignores
	testText(`<$link >to="from here"</$link>`, false, undefined, options);
	testText(`<$link to="from here"`, false, undefined, options);
	testText(`<$LINK to="from here" />`, false, undefined, options);
	testText(`<$link TO="from here" />`, false, undefined, options);
	testText(`<$link to=<<from>> />`, false, undefined, {from: "from", wiki: wiki});
});

it('respects \\rules', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.attrConf('$link', 'to'));
	// allowed
	testText("\\rules except macrodef\n<$link to='from here'/>", true, ['<$link to />'], {wiki: wiki});
	testText("\\rules only html\n<$link to='from here'/>", true, ['<$link to />'], {wiki, wiki});
	// forbidden
	testText("\\rules except html\n<$link to='from here'/>", false, undefined, {wiki: wiki});
	testText("\\rules only macrodef\n<$link to='from here'/>", false, undefined, {wiki: wiki});
});

it('properly ignored when not to be relinked', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.attrConf('$link', 'to'));
	testText(`<$link to="from here XXX" />`, false, undefined, {wiki: wiki});
	testText(`<$link to={{index!!from here}} />`, false, undefined, {wiki: wiki});
	testText(`<$link to={{{[get[from here]]}}} />`, false, undefined, {wiki: wiki});
	testText(`<$link to=<<from here>> />`, false, undefined, {wiki: wiki});
});

it('field attributes with true', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.attrConf('$link', 'to'));
	testText(`<$link trueAttr to="from here">caption</$link>`, true, ['<$link to />'], {wiki: wiki});
	testText(`<$link to />`, false, undefined, {wiki: wiki});
	testText(`<$link to />`, false, undefined, {wiki: wiki, from: "true"});
	testText(`<$link to/> <$link to=true/>`,
	         `<$link to/> <$link to='to there'/>`,
	         ['<$link to />'], {wiki: wiki, from: "true"});
	testText(`<$link to /> <$link to=true />`,
	         `<$link to /> <$link to='to there' />`,
	         ['<$link to />'], {wiki: wiki, from: "true"});
	testText(`<$link to       /> <$link to=true />`,
	         `<$link to       /> <$link to='to there' />`,
	         ['<$link to />'], {wiki: wiki, from: "true"});
});

it('field attributes fun with quotes', function() {
	function testQuote(from, to, options) {
		const wiki = new $tw.Wiki();
		wiki.addTiddler(utils.attrConf('$link', 'to'));
		options = Object.assign({wiki: wiki}, options);
		const report = $tw.utils.hop(options, 'report') ? options.report : ['<$link to />']
		testText(`<$link to=${from}/>`, `<$link to=${to}/>`, report, options);
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
	testQuote("[[from]]", "[[from]]", {from: "from", to: "to", report: undefined});
});

it('supports indirect attribute values', function() {
	// Works on otherwise unmanaged attributes too
	testText("<$link to={{from here}}/>", true, ['<$link to={{}} />']);
	testText("<$link to={{from here!!field}}/>", true, ['<$link to={{!!field}} />']);
	testText("<$link to={{from here##index}}/>", true, ['<$link to={{##index}} />']);
	testText("<$link to   =   {{from here!!field}} />", true, ['<$link to={{!!field}} />']);
	const fails = utils.collectFailures(function() {
		testText("<$link to={{from here}} />", false,
		         ['<$link to={{}} />'],{to:  "title}withBracket"});
	});
	expect(fails.length).toEqual(1);
});

it('allows redirect with bad toTitle if not applicable', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.attrConf('$link', 'to'));
	// Relink used to fail processing {{thing}} because of an illegal
	// toTitle for references, but it shouldn't fail since no replacement
	// will actually occur.
	const fails = utils.collectFailures(function() {
		testText("<$link tag={{thing}} to='from here' />", true,
		         ['<$link to />'], {wiki: wiki, to: "title}withBracket"});
	});
	expect(fails.length).toEqual(0);
});

it('fails on bad indirect attributes', function() {
	var fails
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.attrConf('$link', 'to'));
	fails = utils.collectFailures(function() {
		testText("<$link tooltip={{from here}} to='from here'/>",
		         "<$link tooltip={{from here}} to='E!!E'/>",
		         ['<$link tooltip={{}} />', '<$link to />'],
		         {to: "E!!E", wiki: wiki});
	});
	expect(fails.length).toEqual(1);
	fails = utils.collectFailures(function() {
		testText("<$link tooltip={{from here}} to='from here'/>",
		         "<$link tooltip={{from here}} to='T##T'/>",
		         ['<$link tooltip={{}} />', '<$link to />'],
		         {to: "T##T", wiki: wiki});
	});
	expect(fails.length).toEqual(1);
});

it("handles failure on special operands that fail internally", function() {
	// This was returning {{{undefined}}} in v1.10.0
	var fails;
	fails = utils.collectFailures(function() {
		testText("<$a b={{{[c{from here}]}}} />", false,
		         ['<$a b={{{[c{}]}}} />'], {to: "E}}E"});
	});
	expect(fails.length).toEqual(1);
	fails = utils.collectFailures(function() {
		var wiki = new $tw.Wiki();
		wiki.addTiddler(utils.macroConf("t", "arg", "reference"));
		testText("<$a b=<<t arg:'from here'>> />", false,
		         ['<$a b=<<t arg>> />'], {to: "E!!E", wiki: wiki});
	});
	expect(fails.length).toEqual(1);
});

it("handles failure in innerText", function() {
	// without anything to report for itself, it may drop inner failures.
	const text = "<$link>This fails <t t={{from here}} /></$link>";
	const fails = utils.collectFailures(function() {
		testText(text, false, ['<t t={{}} />'], {to: 'to }}\'"" there'});
	});
	expect(fails.length).toBe(1);
	testText(text, true, ['<t t={{}} />']);
});

it("failure doesn't prevent other relinks", function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.attrConf('$link', 'to'));
	var fails;
	fails = utils.collectFailures(function() {
		testText("<$link tooltip={{from here}} to='from here' />",
		         "<$link tooltip={{from here}} to='to}there' />",
		         ['<$link tooltip={{}} />', '<$link to />'],
		         {to: "to}there", wiki: wiki});
	});
	expect(fails.length).toEqual(1);
	fails = utils.collectFailures(function() {
		testText("<$link tooltip={{{[r{from here}]}}} to='from here' />",
		         "<$link tooltip={{{[r{from here}]}}} to='A}}}B' />",
		         ['<$link tooltip={{{[r{}]}}} />', '<$link to />'],
		         {to: "A}}}B", wiki: wiki});
	});
	expect(fails.length).toEqual(1);
	wiki.addTiddlers([utils.macroConf("t", "arg"),
		{title: "m", tags: "$:/tags/Macro", text: "\\define t(arg)"}]);
	fails = utils.collectFailures(function() {
		testText("<$link to=<<t 'from here'>>/> [[from here]]",
		         "<$link to=<<t 'from here'>>/> [[A' B]\"]]",
		         ['<$link to=<<t arg>> />', '[[from here]]'],
		         {to: "A' B]\"", wiki: wiki});
	});
	expect(fails.length).toEqual(1);
});

it('supports filter attribute values', function() {
	testText("<$link to={{{[[from here]]}}}/>", true, ['<$link to={{{}}} />']);
	testText("<$link to=   {{{[[from here]]}}}    />", true, ['<$link to={{{}}} />']);
	testText("<$link to={{{[[from here]]}}}/>", true, ['<$link to={{{}}} />'], {to: "to {}there"});
});

it('placeholders bad names in filtered attribute values', function() {
	var ph = utils.placeholder;
	var to = "brack}}}s";
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.operatorConf('tag'));
	testText("<$w a={{{from}}}/>", ph(1,to) + "<$w a={{{[<relink-1>]}}}/>",
	         ['<$w a={{{}}} />'], {from: "from", to: to});
	testText("<$w a={{{[tag[from]]}}}/>",
	         ph(1,to) + "<$w a={{{[tag<relink-1>]}}}/>",
	         ['<$w a={{{[tag[]]}}} />'], {from: "from", to: to, wiki: wiki});
});

it('uses macros for literally unquotable titles', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.attrConf('$link', 'to'));
	var macro = utils.placeholder;
	function link(number) {
		return `<$link to=<<relink-${number||1}>>/>`;
	};
	var to = 'End\'s with "quotes"';
	var to2 = 'Another\'"quotes"';
	var expectedLink = '<$link to=<<relink-1>>/>';
	testText("<$link to='from here'/>", macro(1,to)+link(1),
	         ['<$link to />'], {to: to, wiki: wiki});
	testText("Before <$link to='from here'/> After",
	         macro(1,to)+"Before "+link(1)+" After",
	         ['<$link to />'], {to: to, wiki: wiki});
	// It'll prefer triple-quotes, but it should still resort to macros.
	testText('<$link to="""from here"""/>', macro(1,to)+link(1),
	         ['<$link to />'], {to: to, wiki: wiki});
	// Only one macro is made, even when multiple instances occur
	testText("<$link to='from here'/><$link to='from here'/>",
	         macro(1,to)+link(1)+link(1),
	         ['<$link to />', '<$link to />'], {to: to, wiki: wiki});
	// If the first placeholder is taken, take the next
	testText(macro(1,to)+link(1)+"<$link to='from here'/>",
	         macro(2,to2)+macro(1,to)+link(1)+link(2),
	         ['<$link to />'], {to: to2, wiki: wiki});
});

it("doesn't use macros if forbidden by \\rules", function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.attrConf('$link', 'to'));
	const fails = utils.collectFailures(function() {
	testText('\\rules except macrodef\n<$link to="from here"/>', false,
	         ['<$link to />'], {to: "x' y\"", macrodefCanBeDisabled: true, wiki: wiki});
	});
	expect(fails.length).toEqual(1);
});

it('uses macros for unquotable wikitext', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.attrConf('$link', 'to'));
	wiki.addTiddler(utils.attrConf("$test", "wiki", "wikitext"));
	var ph = utils.placeholder;

	var to = "' ]]\"\"\"";
	testText("B <$test wiki='X{{from here}}Y' />",
	         ph("wikitext-1", "X{{"+to+"}}Y")+"B <$test wiki=<<relink-wikitext-1>> />",
	         ['<$test wiki="{{}}" />'],
	         {to: to, wiki: wiki});

	to = "' ]]\"";
	testText('A <$test wiki="""<$link to="from here" />""" /> B',
	         ph(1, to)+'A <$test wiki="""<$link to=<<relink-1>> />""" /> B',
	         ['<$test wiki="<$link to />" />'],
	         {to: to, wiki: wiki});
});

it('detects when internal list uses macros', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.attrConf('$list', 'filter', 'filter'));
	wiki.addTiddler(utils.operatorConf('tag'));
	var to = "bad[]name";
	var r = testText("<$list filter='[tag[from here]]'/>",
	                 utils.placeholder(1,to)+"<$list filter='[tag<relink-1>]'/>",
	                 ['<$list filter="[tag[]]" />'],
	                 {to: to, wiki: wiki});
	expect(console.log).toHaveBeenCalledWith("Renaming 'from here' to '"+to+"' in 'test'");
});

it('ignores blank attribute configurations', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.attrConf('$link', 'to'));
	wiki.addTiddlers(utils.attrConf("$transclude", "tiddler", ""));
	testText(`<$link to="A" /><$transclude tiddler="A" />`,
	         `<$link to="to there" /><$transclude tiddler="A" />`,
	         ['<$link to />'], {wiki: wiki, from: "A"});
});

it('ignores unrecognized attribute configurations', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.attrConf('$link', 'to'));
	wiki.addTiddler(utils.attrConf("$transclude", "tiddler", "kablam"));
	testText(`<$link to="A" /><$transclude tiddler="A" />`,
	         `<$link to="to there" /><$transclude tiddler="A" />`,
	         ['<$link to />'], {wiki: wiki, from: "A"});
});

/**This is legacy support. The 'title' field type used to be called 'field'
 * But field didn't make sense in many contexts.
 */
it('supports "field" attribute configuration', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.attrConf("$transclude", "tiddler", "field"));
	testText(`<$transclude tiddler="from here" />`, true, ['<$transclude tiddler />'], {wiki: wiki});
});

it('filter attributes', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.attrConf('$list', 'filter', 'filter'));
	wiki.addTiddler(utils.operatorConf('tag'));
	testText('<$list filter="A [[from here]] B" />', true,
	         ['<$list filter />'], {wiki: wiki});
	testText('<$list filter="[[from here]] [tag[from here]] B" />', true,
	         ['<$list filter />', '<$list filter="[tag[]]" />'], {wiki: wiki});
	testText('<$list nothing="A [[from here]] B" />', false,
	         undefined, {wiki: wiki});
});

it('mixed failure with string and reference attributes', function() {
	// Regression test on bug which resulted from the output value of the
	// first attribute bleeding into the second if the second fails.
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.attrConf('$link', 'to'));
	const fails = utils.collectFailures(function() {
		testText("<$link to='from here' tooltip={{from here}} />",
		         "<$link to='to}}there' tooltip={{from here}} />",
		         ['<$link to />', '<$link tooltip={{}} />'],
		         {to: "to}}there", wiki: wiki});
	});
	expect(fails.length).toBe(1);
});

it('mixed failure and replacement with macro attributes', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler({title: 'macro', tags: '$:/tags/Macro', text: '\\relink macro A:title B:reference\n\\define macro(A, B) $A$$B$'});
	const fails = utils.collectFailures(function() {
		testText("<$link to=<<macro A:'from here' B:'from here'>> />",
		         "<$link to=<<macro A:'to!!there' B:'from here'>> />",
		         ['<$link to=<<macro A>> />', '<$link to=<<macro B>> />'],
		         {to: 'to!!there', wiki: wiki, fails: 1});
	});
});

it('supports relinking of internal text content', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.attrConf('$link', 'to'));
	testText("<$link to='whatevs'><$a b={{from here!!field}} /></$link>", true, ['<$a b={{!!field}} />'], {wiki: wiki});
	testText("<$link to='from here'><$a b={{from here!!field}} /></$link>", true, ['<$link to />', '<$a b={{!!field}} />'], {wiki: wiki});
	testText("<$link to='whatevs'>[[from here]]</$link>", true, ['[[from here]]'], {wiki: wiki});
	testText("<$link to='from here'>[[from here]]</$link>", true, ['<$link to />', '[[from here]]'], {wiki: wiki});
});

});
