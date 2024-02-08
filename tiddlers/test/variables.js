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
		var defType = options.defType || 'procedure';
		wiki.addTiddler({title: 'global', tags: "$:/tags/Global", text: "\\" + defType + " " + options.from + "(Atitle Bwiki Cfilter) content\n\\relink " + options.from + " Atitle Bwiki:wikitext Cfilter:filter\n"});
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
	// Pragma can come before it. And relink as well, since there is no global
	testText('\\relink from A\n\\define other() B\n\\define from(A) V\n', true, ['\\relink A'], options);
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
// TODO: Order of configuration tabs is bad
// TODO: $transclude blurb isn't neat like $macrocall
// TODO: Maybe move all the rules into the fieldType directory?
// TODO: \\widgets need to work when called as widgets
// TODO: The variable InfoPanel must detect impossible renames
// TODO: Fix link-to-tab for demo pages
// TODO: If blurb attributes are too large, truncate
// TODO: Variables in shadow tiddler should not be editable
// TODO: Proper lingo for the TiddlerInfo panel
// TODO: Change whitelist blurb from $ to |

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
	testText("<$transclude $variable=from Bwiki='<<from>>' />", true, ['<$transclude $variable />', '<<from Bwiki="<<>>" />'], {wiki: wiki});
});

it('[function[]]', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		utils.operatorConf('function', 'variable'),
		utils.attrConf('$list', 'filter', 'filter')]);
	var options = {defType: 'function', wiki: wiki};
	testText("{{{ [[A]function[from]] }}}", true, ['{{{[function[]]}}}'], options);
	testText("{{{ [[A]function[from],[],[<<from>>]] }}}", true, ['{{{[function[from],,[<<>>]]}}}', '{{{[function[]]}}}'], options);
	// Works in other contexts
	testText("<$list filter='[[A]function[from]]'/>", true, ['<$list filter="[function[]]" />'], options);
	testText("<$text text={{{[[A]function[from]]}}}/>", true, ['<$text text={{{[function[]]}}} />'], options);
});

it('[direct call[]]', function() {
	testText("{{{ [[A].from[]] }}}", true, ['{{{[]}}}'], {defType: 'function', from: '.from', to: '.to'});
	testText("{{{ [[A].from[].from[]] }}}", true, ['{{{[]}}}', '{{{[]}}}'], {defType: 'function', from: '.from', to: '.to'});
	// Replaces operator and an operand
	testText("{{{ [.from[],[<<.from>>]] }}}", true, ['{{{[.from,[<<>>]]}}}', '{{{[,[<<.from>>]]}}}'], {defType: 'function', from: '.from', to: '.to'});
	// Better reporting
	testText("{{{ [.from[value],<text>,{filter}] }}}", true, ['{{{[[value],<text>,{filter}]}}}'], {defType: 'function', from: '.from', to: '.to'});
	testText("{{{ [.from[],<>,{}] }}}", true, ['{{{[,<>,{}]}}}'], {defType: 'function', from: '.from', to: '.to'});
	// Bad name changes
	utils.spyFailures(spyOn);
	function testFail(to) {
		utils.failures.calls.reset();
		testText("{{{ [.from[]] }}}", false, ['{{{[]}}}'], {defType: 'function', from: '.from', to: to});
		expect(utils.failures).toHaveBeenCalledTimes(1);
	};
	testFail('to');
	testFail('.t[o');
	testFail('.t{o');
	testFail('.t<o');
	testFail('.t/o');
});

it('updates whitelist', function() {
	function test(paramName, paramType, report) {
		const wiki = new $tw.Wiki();
		var prefix = variablePrefix + 'global ';
		var fromConf = utils.macroConf('from', paramName, paramType);
		wiki.addTiddler(fromConf);
		wiki.addTiddler({title: 'global', tags: "$:/tags/Global", text: "\\procedure from("+paramName+") content\n"});
		expect(utils.getReport(fromConf.title, wiki)[prefix + 'from']).toEqual([report]);
		wiki.renameTiddler(prefix + 'from', prefix + 'to',
		                   {from: 'from', to: 'to'});
		var newConf = utils.macroConf('to', paramName, paramType);
		expect(wiki.tiddlerExists(fromConf.title)).toBe(false);
		expect(wiki.tiddlerExists(newConf.title)).toBe(true);
		expect(wiki.getTiddlerText(newConf.title)).toBe(paramType);
	}
	test('Dwildcard', 'title', '$relink Dwildcard');
	test('Efilter', 'filter', '$relink Efilter:filter');
});

it('does not update whitelist for local macros', function() {
	const wiki = new $tw.Wiki();
	var prefix = variablePrefix + 'local ';
	var conf = utils.macroConf('from', 'param');
	wiki.addTiddler(conf);
	wiki.addTiddler({title: 'local', text: "\\procedure from(param) C\n"});
	expect(utils.getReport(conf.title, wiki)[prefix + 'from']).toBeUndefined();
	wiki.renameTiddler(prefix + 'from', prefix + 'to',
					   {from: 'from', to: 'to'});
	var newConf = utils.macroConf('to', 'param');
	expect(wiki.tiddlerExists(conf.title)).toBe(true);
});

it('handles relink pragma when global exists', function() {
	testText("\\relink from Atitle\nContent", true, ['\\relink Atitle']);
	testText("\\define from(Atitle) $Atitle$\n\\relink from Atitle\nContent", false);
	// It detects proceeding definitions
	testText("\\relink from Atitle\n\\define from(Atitle) $Atitle$\nContent", false);
	testText("\\relink from Atitle\n\n\n\t\\define from(Atitle) $Atitle$\nContent", false);
	testText("\\relink from Atitle\n\\define\n\nfrom(Atitle) $Atitle$\nContent", false);
	// It ignores earlier nested definitions
	testText("\\define outer()\n\\define from(Atitle) $Atitle$\n\\end\n\\relink from Atitle\nContent",
	         "\\define outer()\n\\define from(Atitle) $Atitle$\n\\end\n\\relink to Atitle\nContent",
	         ['\\relink Atitle']);
	// It ignores later nested definitions
	testText("\\relink from Atitle\n\\define outer()\n\\define from(Atitle) $Atitle$\n\\end\nContent",
	         "\\relink to Atitle\n\\define outer()\n\\define from(Atitle) $Atitle$\n\\end\nContent",
	         ['\\relink Atitle']);
	// If an unrelated definition is imported, it can block the global rename
	const wiki = new $tw.Wiki();
	wiki.addTiddler({title: 'import', text: '\\define from(Atitle) Imported'});
	testText("\\import import\n\\relink from Atitle\nContent", false, undefined, {wiki: wiki});
});

it('operator handles different tiddler texts', function() {
	function test(text, expected) {
		const wiki = new $tw.Wiki();
		wiki.addTiddler({title: 'mytest', text: text});
		expect(wiki.filterTiddlers("[[mytest]relink:variables[]]")).toEqual(expected);
	};
	// Works with all fnprocdef and macrodef types
	test("\\define def() Content\n", ['def']);
	test("\\procedure def() Content\n", ['def']);
	test("\\function def() Content\n", ['def']);
	test("\\widget $.def() Content\n", ['$.def']);
	// Works with multiples
	test("\\define myA() Content\n\\procedure myB()\nContent\n\\end", ['myA', 'myB']);
	test("\\define outer()\n\\define inner()\nInner\n\\end inner\n\\end outer\n", ['outer']);
	// If there are duplicates, then return duplicates in the order found
	test("\\define myA() A\n\\define myB() B\n\\define myA() A\n", ['myA', 'myB', 'myA']);
	// other pragma doesn't get in the way
	test("\\relink X p\n\\define myA() A\n", ['myA']);
	test("\\parameters(X)\n\\define myA() A\n", ['myA']);
	// No <$set> stuff. It would only confuse users.
	test("\\define myA() A\n<$set name=noB value=xx>\n", ['myA']);
	// Doesn't pick up those other variable widgets either
	test("<$let A=stuff>\n\nContent\n</$let>", []);
	test("<$vars A=stuff>\n\nContent\n</$let>", []);
});

it('operator handles non-tiddler input', function() {
	const wiki = new $tw.Wiki();
	expect(wiki.filterTiddlers("[[no-exist]relink:variables[]]")).toEqual([]);
});

});
