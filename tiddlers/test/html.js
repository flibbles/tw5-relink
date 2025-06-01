/*\

Tests widget and HTML element attributes.

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
	testText(`<$link to=from />`, true,
	         ['<$link to />'], {wiki: wiki, from: "from", to: "true"});
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
	utils.spyFailures(spyOn);
	testText("<$link to={{from here}} />", false,
			 ['<$link to={{}} />'],{to:  "title}withBracket"});
	expect(utils.failures).toHaveBeenCalledTimes(1);
});

it('allows redirect with bad toTitle if not applicable', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.attrConf('$link', 'to'));
	// Relink used to fail processing {{thing}} because of an illegal
	// toTitle for references, but it shouldn't fail since no replacement
	// will actually occur.
	utils.spyFailures(spyOn);
	testText("<$link tag={{thing}} to='from here' />", true,
			 ['<$link to />'], {wiki: wiki, to: "title}withBracket"});
	expect(utils.failures).not.toHaveBeenCalled();
});

it('fails on bad indirect attributes', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.attrConf('$link', 'to'));
	utils.spyFailures(spyOn);
	testText("<$link tooltip={{from here}} to='from here'/>",
			 "<$link tooltip={{from here}} to='E!!E'/>",
			 ['<$link tooltip={{}} />', '<$link to />'],
			 {to: "E!!E", wiki: wiki});
	expect(utils.failures).toHaveBeenCalledTimes(1);
	utils.failures.calls.reset();
	testText("<$link tooltip={{from here}} to='from here'/>",
			 "<$link tooltip={{from here}} to='T##T'/>",
			 ['<$link tooltip={{}} />', '<$link to />'],
			 {to: "T##T", wiki: wiki});
	expect(utils.failures).toHaveBeenCalledTimes(1);
});

it("handles failure on special operands that fail internally", function() {
	// This was returning {{{undefined}}} in v1.10.0
	utils.spyFailures(spyOn);
	testText("<$a b={{{[c{from here}]}}} />", false,
			 ['<$a b={{{[c{}]}}} />'], {to: "E}}E"});
	expect(utils.failures).toHaveBeenCalledTimes(1);

	utils.failures.calls.reset();
	var wiki = new $tw.Wiki();
	wiki.addTiddler(utils.macroConf("t", "arg", "reference"));
	testText("<$a b=<<t arg:'from here'>> />", false,
			 ['<$a b=<<t arg>> />'], {to: "E!!E", wiki: wiki});
	expect(utils.failures).toHaveBeenCalledTimes(1);
});

it("handles failure in innerText", function() {
	// without anything to report for itself, it may drop inner failures.
	const text = "<$link>This fails <t t={{from here}} /></$link>";
	utils.spyFailures(spyOn);
	testText(text, false, ['<t t={{}} />'], {to: 'to }}\'"" there'});
	expect(utils.failures).toHaveBeenCalledTimes(1);
	testText(text, true, ['<t t={{}} />']);
});

it("failure doesn't prevent other relinks", function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.attrConf('$link', 'to'));
	utils.spyFailures(spyOn);
	testText("<$link tooltip={{from here}} to='from here' />",
			 "<$link tooltip={{from here}} to='to}there' />",
			 ['<$link tooltip={{}} />', '<$link to />'],
			 {to: "to}there", wiki: wiki});
	expect(utils.failures).toHaveBeenCalledTimes(1);

	utils.failures.calls.reset();
	testText("<$link tooltip={{{[r{from here}]}}} to='from here' />",
			 "<$link tooltip={{{[r{from here}]}}} to='A}}}B' />",
			 ['<$link tooltip={{{[r{}]}}} />', '<$link to />'],
			 {to: "A}}}B", wiki: wiki});
	expect(utils.failures).toHaveBeenCalledTimes(1);

	wiki.addTiddlers([utils.macroConf("t", "arg"),
		{title: "m", tags: "$:/tags/Macro", text: "\\define t(arg)"}]);
	utils.failures.calls.reset();
	testText("<$link to=<<t 'from here'>>/> [[from here]]",
			 "<$link to=<<t 'from here'>>/> [[A' B]\"]]",
			 ['<$link to=<<t arg>> />', '[[from here]]'],
			 {to: "A' B]\"", wiki: wiki});
	expect(utils.failures).toHaveBeenCalledTimes(1);
});

it('supports filter attribute values', function() {
	testText("<$link to={{{[[from here]]}}}/>", true, ['<$link to={{{}}} />']);
	testText("<$link to=   {{{[[from here]]}}}    />", true, ['<$link to={{{}}} />']);
	testText("<$link to={{{[[from here]]}}}/>", true, ['<$link to={{{}}} />'], {to: "to {}there"});
	// Local macros inside of filtered attributes
	testText("\\define macro(A) --$A$--\n\\relink macro A\n<$link to={{{ [<macro 'from here'>] }}} />", true, ['<$link to={{{[<macro A>]}}} />']);
});

it('can find recently imported variables in attributes', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler({title: "X", text: "\\define macro(param)\n\\relink macro param"});
	testText("\\import X\n<$macrocall $name=macro param='from here'/>", true,
	         ['<<macro param />'], {wiki: wiki});
});

it('bad names in filtered attribute values', function() {
	var to = "brack}}}s";
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.operatorConf('tag'));
	utils.spyFailures(spyOn);
	testText("<$w a={{{from}}}/>", false, ['<$w a={{{}}} />'], {from: "from", to: to});
	expect(utils.failures).toHaveBeenCalledTimes(1);
	utils.failures.calls.reset();
	testText("<$w a={{{[tag[from]]}}}/>", false, ['<$w a={{{[tag[]]}}} />'], {from: "from", to: to, wiki: wiki});
	expect(utils.failures).toHaveBeenCalledTimes(1);
});

it('handles failure for string attributes', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.attrConf('$link', 'to'));
	utils.spyFailures(spyOn);
	testText("<$link to='from here'/>", false,
	         ['<$link to />'], {to:  'End\'s with ``` "quotes"', wiki: wiki});
	expect(utils.failures).toHaveBeenCalledTimes(1);
});

it("recognizes when a title is actually a macro placeholder", function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.attrConf('$link', 'to'));
	testText('\\define macro(abc) <$link to="""$A$""" />', true, ['\\define macro() <$link to />'], {wiki: wiki, from: '$A$'});
	testText('\\define macro(abc def) <$link to="""$abc$""" />', false, undefined, {wiki: wiki, from: '$abc$'});
});

it("doesn't use macros if forbidden by \\rules", function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.attrConf('$link', 'to'));
	utils.spyFailures(spyOn);
	testText('\\rules except macrodef\n<$link to="from here"/>', false,
	         ['<$link to />'], {to: "x' ``` y\"", wiki: wiki});
	expect(utils.failures).toHaveBeenCalledTimes(1);
});

it('detects when internal list uses macros', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.attrConf('$list', 'filter', 'filter'));
	wiki.addTiddler(utils.operatorConf('tag'));
	var to = "bad[]name";
	utils.spyFailures(spyOn);
	var r = testText("<$list filter='[tag[from here]]'/>", false, ['<$list filter="[tag[]]" />'], {to: to, wiki: wiki});
	expect(utils.failures).toHaveBeenCalledTimes(1);
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
	testText('\\define macro(A) --$A$--\n\\relink macro A\n<$list filter="[<macro \'from here\'>]" />', true, ['<$list filter="[<macro A>]" />'], {wiki: wiki});
});

it('mixed failure with string and reference attributes', function() {
	// Regression test on bug which resulted from the output value of the
	// first attribute bleeding into the second if the second fails.
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.attrConf('$link', 'to'));
	utils.spyFailures(spyOn);
	testText("<$link to='from here' tooltip={{from here}} />",
			 "<$link to='to}}there' tooltip={{from here}} />",
			 ['<$link to />', '<$link tooltip={{}} />'],
			 {to: "to}}there", wiki: wiki});
	expect(utils.failures).toHaveBeenCalledTimes(1);
});

it('mixed failure and replacement with macro attributes', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler({title: 'macro', tags: '$:/tags/Macro', text: '\\relink macro A:title B:reference\n\\define macro(A, B) $A$$B$'});
	utils.spyFailures(spyOn);
	testText("<$link to=<<macro A:'from here' B:'from here'>> />",
			 "<$link to=<<macro A:'to!!there' B:'from here'>> />",
			 ['<$link to=<<macro A>> />', '<$link to=<<macro B>> />'],
			 {to: 'to!!there', wiki: wiki});
	expect(utils.failures).toHaveBeenCalledTimes(1);
});

(utils.atLeastVersion("5.3.0")? it: xit)('substitution attributes without substitution', function() {
	const wiki = new $tw.Wiki();
	function testFail() {
		utils.failures.calls.reset();
		testText.apply(this, arguments);
		expect(utils.failures).toHaveBeenCalledTimes(1);
	};
	wiki.addTiddlers([
		utils.attrConf('$link', 'to'),
		utils.attrConf('$list', 'filter', 'filter'),
		utils.operatorConf('tag'),
		utils.macroConf('tag', 'tag'),
		utils.macroConf('tabs', 'tabsList', 'filter')]);
	utils.spyFailures(spyOn);
	testText("<$link to=`from here`/>", "<$link to='to there'/>", ["<$link to />"],{wiki: wiki});
	testText("<$list filter=`[tag[from here]]`/>", "<$list filter='[tag[to there]]'/>", ["<$list filter=`[tag[]]` />"],{wiki: wiki});
	testText("<$macrocall $name=tag tag=`from here`/>", "<$macrocall $name=tag tag='to there'/>", ["<<tag tag />"],{wiki: wiki});
	testText("<$macrocall $name=tabs tabsList=`[tag[from here]]`/>", "<$macrocall $name=tabs tabsList='[tag[to there]]'/>", ["<<tabs tabsList=`[tag[]]` />"],{wiki: wiki});
	// Presents of substition in titles
	testText("<$link to=`$(from)$`/>", false, undefined, {wiki: wiki, from: "from"});
	testText("<$link to=`$(from)$`/>", false, undefined, {wiki: wiki, from: "$(from)$"});
	testText("<$link to=`from $(here)$`/>", false, undefined, {wiki: wiki, from: "from $(here)$"});
	// Not quite substitution in titles
	testText("<$link to=`$(from here)$`/>", false, undefined, {wiki: wiki, from: "$(from here)$"});
	// backticks in value
	testText("<$link to=`from here`/>", "<$link to='to```there'/>", ["<$link to />"],{wiki: wiki, to: "to```there"});
	testText("<$link to=`from here`/>", "<$link to='to`there`'/>", ["<$link to />"],{wiki: wiki, to: "to`there`"});
	// substitutions in string values are ignored
	testText("<$link to=`from here`/>", "<$link to=to$(d)$there/>", ["<$link to />"],{wiki: wiki, to: "to$(d)$there"});
	testText("<$link to=`from here`/>", "<$link to='to${d}$ there'/>", ["<$link to />"],{wiki: wiki, to: "to${d}$ there"});
	// substitution in irrelevant attributes
	testText("<$link to='from here' class=`myclass` />", true, ['<$link to />'], {wiki: wiki});
});

(utils.atLeastVersion("5.3.0")? it: xit)('substitution attributes with embedded filters', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.operatorConf('tag'));
	function testFail() {
		utils.failures.calls.reset();
		testText.apply(this, arguments);
		expect(utils.failures).toHaveBeenCalledTimes(1);
	};
	testText("<$link to=`${from}$`/>", false, undefined, {wiki: wiki, from: "${from}$"});
	testText("<$text text=`${[[from here]]}$ ${[tag[from here]]}$`/>", true, ["<$text text=`${}$` />", "<$text text=`${[tag[]]}$` />"], {wiki: wiki});
	testText("<$text text=`${[[from here]] [tag[from here]]}$`/>", true, ["<$text text=`${}$` />", "<$text text=`${[tag[]]}$` />"], {wiki: wiki});
	testText("<$text text=`${from}$`/>", true, ["<$text text=`${}$` />"], {wiki: wiki, from: "from", to: "to}}}there"});
	utils.spyFailures(spyOn);
	testFail("<$text text=`${[tag{from here}]}$`/>", false, ["<$text text=`${[tag{}]}$` />"], {wiki: wiki, to: "to}there"});
	// Mix of success and failure
	testFail("<$text text=`${[tag{from here}] [[from here]] }$`/>",
	         "<$text text=`${[tag{from here}] to}there }$`/>",
	         ["<$text text=`${[tag{}]}$` />", "<$text text=`${}$` />"],
	         {wiki: wiki, to: "to}there"});
});

(utils.atLeastVersion("5.3.0")? it: xit)('substitution attributes with actual substitution', function() {
	const wiki = new $tw.Wiki();
	utils.spyFailures(spyOn);
	function testFail() {
		utils.failures.calls.reset();
		testText.apply(this, arguments);
		expect(utils.failures).toHaveBeenCalledTimes(1);
	};
	wiki.addTiddlers([
		utils.attrConf('$link', 'to'),
		utils.attrConf('$list', 'filter', 'filter'),
		utils.operatorConf('tag'),
		utils.macroConf('tag', 'tag'),
		utils.macroConf('tabs', 'tabsList', 'filter')]);
	testFail("<$list filter=`${from}$ from`/>",
	         "<$list filter=`${from}$ to}$there`/>",
	         ["<$list filter=`${}$` />", "<$list filter=`` />"],
	         {wiki: wiki, from: "from", to: "to}$there"});
	// backticks in new title
	testText("<$list filter=`$(var)$ from`/>", true, ["<$list filter=`` />"],{wiki: wiki, from: 'from', to: "to"});
	testText("<$list filter=`$(var)$ from`/>", "<$list filter=```$(var)$ to``there```/>", ["<$list filter=`` />"],{wiki: wiki, from: 'from', to: "to``there"});
	testText("<$list filter=```$(var)$ from`here```/>", "<$list filter=`$(var)$ to`/>", ["<$list filter=`` />"],{wiki: wiki, from: "from`here", to: "to"});
	// substitutions in new title
	testText("<$list filter=`$(var)$ from`/>", false, ["<$list filter=`` />"],{wiki: wiki, from: 'from', to: "t$(d)$o"});
	testText("<$list filter=`$(var)$ from`/>", false, ["<$list filter=`` />"],{wiki: wiki, from: 'from', to: "t${d}$o"});
	// Not quite substitution in titles
	testText("<$list filter=`$(var)$ from)$(here`/>", true, ["<$list filter=`` />"],{wiki: wiki, from: "from)$(here", to: "to)$(there"});
	// Presents of substition near titles
	testText("<$list filter=`[[from here]] $(sub)$`/>", true, ["<$list filter=`` />"], {wiki: wiki});
	testFail("<$link to=`from here`/>", false, ["<$link to />"],{wiki: wiki, to: "to`\"\"\"'there`"});
	testText("<$list filter=`[[from here]] $(other)$`/>", "<$list filter=```to`there` $(other)$```/>", ["<$list filter=`` />"],{wiki: wiki, to: "to`there`"});
});

(utils.atLeastVersion("5.3.0")? it: xit)('strange edgecase with substitution', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler( utils.attrConf('$list', 'filter', 'filter') );
	// Strange edge case with backtics
	utils.spyFailures(spyOn);
	testText("<$list filter='a$(b from'/>", false, ["<$list filter />"], {wiki: wiki, from: "from", to: "to)$'\"\"\"there"});
	expect(utils.failures).toHaveBeenCalledTimes(1);
});

it('switches to using backticks when necessary', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.attrConf('$link', 'to'));
	utils.spyFailures(spyOn);
	function testPass(to, expected) {
		testText("<$link to='from here'/>", expected, ['<$link to />'], {wiki: wiki, to: to});
	};
	function testFail(to) {
		testText("<$link to='from here'/>", false, ['<$link to />'], {wiki: wiki, to: to});
		expect(utils.failures).toHaveBeenCalledTimes(1);
		utils.failures.calls.reset();
	};
	if (utils.atLeastVersion("5.3.0")) {
		testPass('to\'"""there',     '<$link to=`to\'"""there`/>');
		testPass('to\'there"',       '<$link to=`to\'there"`/>');
		testPass('to\'"""` there',   '<$link to=```to\'"""` there```/>');
		testFail('to\'""" there`');
		testPass('to\'"""$( there',   '<$link to=`to\'"""$( there`/>');
		testPass('to\'"""$()$ there', '<$link to=`to\'"""$()$ there`/>');
		testPass('to\'"""$(d$()$ there', '<$link to=`to\'"""$(d$()$ there`/>');
		testPass('to\'"""$($)$ there', '<$link to=`to\'"""$($)$ there`/>');
		testPass('to\'"""$())$ there', '<$link to=`to\'"""$())$ there`/>');
		testFail('to\'"""$(d)$ there');
		testFail('to\'"""$($(d)$ there');
		// Now check filter placeholders
		testPass('to\'"""${ there',   '<$link to=`to\'"""${ there`/>');
		testPass('to\'"""${}$ there', '<$link to=`to\'"""${}$ there`/>');
		testFail('to\'"""${$}$ there');
		testFail('to\'"""${}}$ there');
		testFail('to\'"""$(d)$ there');
		testFail('to\'"""$($(d)$ there');
	} else {
		// In old versions, just make sure the backticks aren't being used
		testFail('to\'"""there');
	}
});

it('supports relinking of internal text content', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.attrConf('$link', 'to'));
	testText("<$link to='whatevs'><$a b={{from here!!field}} /></$link>", true, ['<$a b={{!!field}} />'], {wiki: wiki});
	testText("<$link to='from here'><$a b={{from here!!field}} /></$link>", true, ['<$link to />', '<$a b={{!!field}} />'], {wiki: wiki});
	testText("<$link to='whatevs'>[[from here]]</$link>", true, ['[[from here]]'], {wiki: wiki});
	testText("<$link to='from here'>[[from here]]</$link>", true, ['<$link to />', '[[from here]]'], {wiki: wiki});
});

it('handles attributes that have placeholders', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.attrConf('$widg', 'list', 'list'));
	wiki.addTiddler(utils.attrConf('$list', 'emptyMessage', 'wikitext'));
	// List string attributes
	testText('\\define macro(abc) <$widg list="A $abc$ D"/>', false, undefined, {wiki: wiki, from: '$abc$'});
	// wikitext string attributes
	testText('\\define macro(abc) <$list emptyMessage="X{{$abc$}}"/>', false, undefined, {wiki: wiki, from: '$abc$'});
	// indirect attributes
	testText('\\define macro(abc) <$text text={{$abc$!!title}}/>', false, undefined, {wiki: wiki, from: '$abc$'});
	utils.spyFailures(spyOn);
	function fails(text, report) {
		utils.failures.calls.reset();
		testText(text, false, [report], {wiki: wiki, to: '$abc$'});
		expect(utils.failures).toHaveBeenCalledTimes(1);
	};
	fails('\\define macro(abc) <$widg list="A [[from here]] D"/>',
	      '\\define macro() <$widg list />');
	fails('\\define macro(abc) <$text text={{from here!!title}}/>',
	      '\\define macro() <$text text={{!!title}} />');
	fails('\\define macro(abc) <$list emptyMessage="X{{from here}}"/>',
	      '\\define macro() <$list emptyMessage="{{}}" />');
});

it('supports widgets that support regexp matching fields to attrs', function() {
	const wiki = new $tw.Wiki();
	const prefix = "$:/config/flibbles/relink/fieldattributes/";
	wiki.addTiddlers([
		utils.fieldConf("myfield"),
		utils.fieldConf("mylist", "list"),
		$tw.wiki.getTiddler(prefix + "$action-createtiddler"),
		$tw.wiki.getTiddler(prefix + "$jsontiddler")]);
	// This widget follows a [^$].* pattern
	testText('<$action-createtiddler myfield="from here" />', true,
	         ['<$action-createtiddler myfield />'], {wiki: wiki});
	testText('<$action-createtiddler mylist="[[from here]] X" />', true,
	         ['<$action-createtiddler mylist />'], {wiki: wiki});
	testText('<$action-createtiddler $myfield="from here" />', false,
	         undefined, {wiki: wiki});
	testText('<$action-createtiddler notmyfield="from here" />', false,
	         undefined, {wiki: wiki});
	testText('<$action-createtiddler myfieldNot="from here" />', false,
	         undefined, {wiki: wiki});
	// Test the \$(.*) pattern
	testText('<$jsontiddler $myfield="from here" />', true,
	         ['<$jsontiddler $myfield />'], {wiki: wiki});
	testText('<$jsontiddler myfield="from here" />', false,
	         undefined, {wiki: wiki});
	testText('<$jsontiddler $$myfield="from here" />', false,
	         undefined, {wiki: wiki});
	testText('<$jsontiddler $xmyfield="from here" />', false,
	         undefined, {wiki: wiki});
	testText('<$jsontiddler $myfieldNot="from here" />', false,
	         undefined, {wiki: wiki});
	// Can now add new patterns to the whitelist
	wiki.addTiddler($tw.wiki.getTiddler(prefix + "$action-deletefield"));
	testText('<$action-deletefield myfield="from here" />', true,
	         ['<$action-deletefield myfield />'], {wiki: wiki});
});

it('supports messages using $action-sendmessage', function() {
	const wiki = new $tw.Wiki();
	const prefix = "$:/config/flibbles/relink/messages/";
	wiki.addTiddlers([
		utils.fieldConf("myfield"),
		utils.fieldConf("$value"),
		utils.fieldConf("myref", "reference"),
		$tw.wiki.getTiddler(prefix + "tm-new-tiddler")]);
	testText('<$button><$action-sendmessage $message=tm-new-tiddler title=T myfield="from here" />', true,
	         ['<$action-sendmessage tm-new-tiddler myfield />'],
	         {wiki: wiki});
	testText('<$button><$action-sendmessage $message=tm-new-tiddler title=T myref="from here!!field" />', true,
	         ['<$action-sendmessage tm-new-tiddler myref="!!field" />'],
	         {wiki: wiki});
	// These cases should not be touched
	testText('<$button><$action-sendmessage $message={{tm-new-tiddler}} title=T myfield="from here" />', false, undefined, {wiki: wiki});
	testText('<$button><$action-sendmessage $message=<<tm-new-tiddler>> title=T myfield="from here" />', false, undefined, {wiki: wiki});
	testText('<$button><$action-sendmessage title=T myfield="from here" />', false, undefined, {wiki: wiki});
	testText('<$button><$action-sendmessage title=T $value="from here" />', false, undefined, {wiki: wiki});
});

});
