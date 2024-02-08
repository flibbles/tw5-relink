/*\

Tests procedures.
E.G.

\procedure macro() ...
\procedure macro()
...
\end

\*/

var utils = require("test/utils");

var variablePrefix = "$:/temp/flibbles/relink-variables/";

function testText(text, expected, report, options) {
	options = Object.assign({from: 'from', to: 'to'}, options);
	const wiki = options.wiki || new $tw.Wiki();
	if (expected === true) {
		expected = text.split(options.from).join(options.to);
	} else if (expected === false) {
		expected = text;
	}
	wiki.addTiddler({title: 'test', text: text});
	if (!options.noglobal) {
		wiki.addTiddler({title: 'global', tags: "$:/tags/Global", text: "\\procedure " + options.from + "(Atitle Bwiki Cfilter) content\n\\relink " + options.from + " Atitle Bwiki:wikitext Cfilter:filter\n"});
	}
	var prefix = options.prefix || (variablePrefix + "global ");
	expect(utils.getReport('test', wiki)[prefix + options.from]).toEqual(report);
	wiki.renameTiddler(prefix + options.from, prefix + options.to, options);
	expect(utils.getText('test', wiki)).toEqual(expected);
};

describe('variables', function() {

beforeEach(function() {
	spyOn(console, 'log');
});

it('relinks actual definition', function() {
	var prefix = variablePrefix + "test ";
	var options = {prefix: prefix, noglobal: true};
	testText('\\whitespace trim\n\n\t\\procedure from() C\n', true, undefined, options);
	// Whitespace preservation
	testText('\t\\procedure from( arg ) C\n', true, undefined, options);
	testText('\\procedure from(\n\targ\n) C\n', true, undefined, options);
	testText('\\define from(\n\targ\n) C\n', true, undefined, options);
	testText('\\define\n\tfrom(\n\targ\n) C\n', true, undefined, options);
	// Recrursive
	testText('\\define from(arg) call-<<from>>\n', true, ['\\define from() <<>>'], options);
	// Called later in same file
	testText('\\define from(arg) content\n\n<<from>>\n', true, ['<<>>'], options);
	// Nested methods are ignored
	testText('\\define outer(arg)\n\\define from()  content\n<<outer>>\n\\end\n', false, undefined, options);
	testText('\\define from(A)\n\\define from() inner\ncall-<<from>>\n\\end\n',
	         '\\define to(A)\n\\define from() inner\ncall-<<from>>\n\\end\n',
	         undefined, options);
	// Repeat macros
	testText('\\define from(arg) first\n\\define from() second\nbody', true, undefined, options);
	// Illegal names
	utils.spyFailures(spyOn);
	testText('\\define from(arg) first\nbody',
	         false, undefined, Object.assign(options, {to: "to(this"}));
	expect(utils.failures).toHaveBeenCalledTimes(1);
	utils.failures.calls.reset();
	testText('\\define from(arg) first\nbody',
	         false, undefined, Object.assign(options, {to: "to this"}));
	expect(utils.failures).toHaveBeenCalledTimes(1);
	//Mixed failure and success
	utils.failures.calls.reset();
	testText('\\define from(arg) <<from>>\nbody',
	         '\\define t>>o(arg) <<from>>\nbody',
	         ['\\define from() <<>>'], Object.assign(options, {to: "t>>o"}));
	expect(utils.failures).toHaveBeenCalledTimes(1);
});

it('overriding definitions in other files', function() {
	testText('\\define else() In wrong file\n\n<<from>>', true, ['<<>>']);
	testText('\\define from() In wrong file\n\n<<from>>', false, undefined);
});

// TODO: Test if the toTiddler isn't a legal macroname representative
// TODO: Test whitespace trim, cause it was broken before
// TODO: The //Relink// Missing panels is flooded with garbage
// TODO: Disallow global <$set> bullshit
// TODO: Something is wrong with the collapsing fields in the whitelist
// TODO: $transclude blurb isn't neat like $macrocall
// TODO: \relink directives must update too

it('macrocall wikitext', function() {
	testText("Begin <<from>> End", true, ['<<>>']);
	testText("<<from content>>", true, ['<< content>>']);
	testText("<<from Bwiki: '<<from>>'>>", true, ['<<from Bwiki: "<<>>">>', '<< <<from>>>>']);
});

it('macrocall wikitext bad names', function() {
	utils.spyFailures(spyOn);
	function test(badName) {
		utils.failures.calls.reset();
		testText("<<from content>>", false, ['<< content>>'], {to: badName});
		expect(utils.failures).toHaveBeenCalledTimes(1);
	};
	test("to>this");
	test("to\"this");
	test("to'this");
	test("to=this");
});

it('macro attributes', function() {
	testText("<$text text=<<from>> />", true, ['<$text text=<<>> />']);
	testText("<$text text=<<from   title >> />", true, ['<$text text=<< title>> />']);
});

it('$transclude', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.attrConf("$transclude", "$variable", "variable"));
	testText("<$transclude $variable=from />", true, ['<$transclude $variable />'], {wiki: wiki});
	// The following don't replace
	testText("<$transclude $variable={{from}} />", false, undefined, {wiki: wiki});
	testText("<$transclude $variable={{{from}}} />", false, undefined, {wiki: wiki});
	testText("<$transclude />", false, undefined, {wiki: wiki});
	// Recursive
	testText("<$transclude $variable=from Atitle=<<from>> />", true, ['<$transclude $variable />', '<$transclude Atitle=<<>> />'], {wiki: wiki});
});

it('operator handles different tiddler texts', function() {
	function test(text, expected) {
		const wiki = new $tw.Wiki();
		wiki.addTiddler({title: 'mytest', text: text});
		expect(wiki.filterTiddlers("[[mytest]relink:variables[]]")).toEqual(expected);
	};
	test("\\define myA() Content\n\\procedure myB()\nContent\n\\end", ['myA', 'myB']);
	test("\\define outer()\n\\define inner()\nInner\n\\end inner\n\\end outer\n", ['outer']);
	// Can pick up $set widgets as well
	test("<$set name=A value=stuff>\n\n<$set name=B value=other>\n\nContent\n</$set></$set>", ['A', 'B']);
	test("<$let A=stuff>\n\nContent\n</$let>", []);
	test("<$vars A=stuff>\n\nContent\n</$let>", []);
	test("\\define myA() A\n\\define myB() B\n\\define myA() A\n", ['myA', 'myB', 'myA']);
});

it('operator handles non-tiddler input', function() {
	const wiki = new $tw.Wiki();
	expect(wiki.filterTiddlers("[[no-exist]relink:variables[]]")).toEqual([]);
});

});
