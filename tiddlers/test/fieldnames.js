/*\

Tests the relink-fieldnames sub plugin.

\*/

var utils = require("./utils");

describe('fieldname plugin', function() {

const blacklist = "$:/config/flibbles/relink/fieldnames/blacklist";
const maxLength = 30;

function getWiki() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler({title: blacklist, filter: "text title type"});
	return wiki;
};

beforeEach(function() {
	spyOn(console, 'log');
});

// This relies on the relink-titles default rule instead of making a rule for
// for itself. This may need to change in the future.
it('updates the visibility settings', function() {
	const wiki = getWiki();
	const settingFrom = "$:/config/EditTemplateFields/Visibility/from";
	const settingTo = "$:/config/EditTemplateFields/Visibility/to";
	wiki.addTiddlers([
		{title: "from", text: "anything"},
		$tw.wiki.getTiddler("$:/config/flibbles/relink-titles/lookup/patterns"),
		{title: settingFrom, text: "hide"}]);
	expect(utils.getReport(settingFrom, wiki).from)
		.toEqual(["title: $:/config/EditTemplateFields/Visibility/..."]);
	wiki.renameTiddler("from", "to");
	expect(wiki.tiddlerExists(settingFrom)).toBe(false);
	expect(wiki.tiddlerExists(settingTo)).toBe(true);
	expect(wiki.getTiddler(settingTo).fields.text).toBe("hide");
});

it('reports only non-blacklisted tiddlers', function() {
	const realBlacklist = $tw.wiki.getTiddler(blacklist);
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: 'test', exists: "content", text: "content"},
		{title: "exists"}, // Exists gets reported
		{title: "text"}]);
	// By default, nothing gets reported when there is no blacklist
	expect(utils.getReport('test', wiki)).toEqual({});
	// But when it's pointing to a blacklist. Uses its filter.
	wiki.addTiddlers([realBlacklist,
		{title: "$:/language/Docs/Fields/title", text: "defined"}]);
	expect(utils.getReport('test', wiki))
		.toEqual({ "exists": [": content"], "text": [": content"] });
	// The blank should have been skipped, but not once it's filled out.
	wiki.addTiddler({title: "$:/language/Docs/Fields/text", text: "defined"});
	expect(utils.getReport('test', wiki)).toEqual({ "exists": [": content"] });
});

it('reports exclude fields when specified', function() {
	const wiki = getWiki();
	wiki.addTiddlers([
		{title: 'test', exists: "existing-content", missing: "missing-content"},
		{title: "exists"}]);
	expect(utils.getReport('test', wiki)).toEqual({
		"exists": [": existing-content"],
		"missing": [": missing-content"] });
	expect(utils.getReport('test', wiki, {hard: true})).toEqual({});
});

it('reports exclude uses of fields when specified', function() {
	const suffixesPrefix = "$:/config/flibbles/relink/suffixes/";
	const fieldAttrPrefix = "$:/config/flibbles/relink/fieldattributes/";
	function testSoft(text) {
		const wiki = getWiki();
		wiki.addTiddlers([
			{title: 'test', text: text},
			utils.operatorConf("has", "fieldname"),
			$tw.wiki.getTiddler(suffixesPrefix + "contains"),
			$tw.wiki.getTiddler(fieldAttrPrefix + "$action-createtiddler"),
			utils.operatorConf("fields", "fieldnamelist")]);
		expect(utils.getReport('test', wiki).from).not.toBeUndefined();
		expect(utils.getReport('test', wiki, {hard: true})).toEqual({});
	};
	testSoft("{{{ [has[from]] }}}");
	testSoft("{{{ [fields[from]] }}}");
	testSoft("{{{ [contains:from[text]] }}}");
	testSoft("{{{ [from[text]] }}}");
	testSoft("{{{ [search:from[text]] }}}");
	testSoft("{{{ [search:from[text]] }}}");
	testSoft("<$action-createtiddler from=value />");
	testSoft("<$text text={{!!from}} />");
});

it('reports field name and field value', function() {
	const wiki = getWiki();
	wiki.addTiddlers([
		{title: 'test', active: "other"},
		{title: "active"},
		utils.fieldConf("active")]);
	expect(utils.getReport('test', wiki))
		.toEqual({ "active": [": other"], "other": ["active"] });
});

it('abridges reports if field value is long', function() {
	const string = "This is an excessively long value to have as a field.";
	const wiki = getWiki();
	wiki.addTiddlers([
		{title: 'test', field: string},
		{title: 'field'}]);
	expect(utils.getReport('test', wiki).field)
		.toEqual([": " + string.substr(0,maxLength) + "..."]);
});

it('does not invalidate reports when renaming to existing field', function() {
	const wiki = getWiki();
	wiki.addTiddlers([
		{title: 'test', to: "content"},
		{title: 'from'}]);
	// It's important to run this test first to instantiate any caches
	utils.getReport('test', wiki);
	wiki.renameTiddler('from', 'to');
	expect(utils.getReport('test', wiki)).toEqual({to: [': content']});
});

it('doesn\'t clobber existing field values', function() {
	const wiki = getWiki();
	wiki.addTiddlers([
		{title: 'test1', from: "content"},
		{title: 'test2', from: "content", to: ""}, // Blanks count as values
		{title: 'from'}]);
	utils.spyFailures(spyOn);
	wiki.renameTiddler('from', 'to');
	var test1Fields = wiki.getTiddler('test1').fields;
	var test2Fields = wiki.getTiddler('test2').fields;
	expect(test1Fields.from).toBeUndefined();
	expect(test1Fields.to).toBe("content");
	expect(test2Fields.from).toBe("content");
	expect(test2Fields.to).toBe("");
	expect(utils.failures).toHaveBeenCalledTimes(1);
	expect(utils.failures.calls.first().args[0]).toEqual(['test2']);
});

it('avoids relinking to blacklisted fields', function() {
	const wiki = getWiki();
	wiki.addTiddlers([
		{title: 'test', from: "content"},
		{title: 'from'}]);
	utils.spyFailures(spyOn);
	wiki.renameTiddler('from', 'type');
	expect(wiki.getTiddler('test').fields.from).toBe('content');
	expect(wiki.getTiddler('test').fields.type).toBeUndefined();
	// Throws an error since the user might wonder why they're not clobbering
	// every single tiddler?
	expect(utils.failures).toHaveBeenCalledTimes(1);
});

it('avoids relinking from blacklisted fields', function() {
	const wiki = getWiki();
	wiki.addTiddlers([
		{title: 'test', text: "content"},
		{title: 'title'}]);
	wiki.renameTiddler('title', 'to');
	// Doesn't throw an error since it was ignoring "title" to begin with.
	expect(wiki.getTiddler('test').fields.title).toBe('test');
	expect(wiki.getTiddler('test').fields.to).toBeUndefined();
});

it("can relink both field name and field value", function() {
	const wiki = getWiki();
	const fromConf = utils.fieldConf("from", "list");
	const toConf = utils.fieldConf("to", "list");
	wiki.addTiddlers([
		{title: 'test', from: "Content contains from"},
		{title: 'from'},
		fromConf]);
	wiki.renameTiddler("from", "to");
	expect(wiki.getTiddler('test').fields.from).toBeUndefined();
	expect(wiki.getTiddler('test').fields.to).toBe("Content contains to");
	// The whitelist entry should have been updated
	expect(wiki.tiddlerExists(fromConf.title)).toBe(false);
	expect(wiki.getTiddler(toConf.title).fields.text).toBe("list");
});

it("can relink a tiddler with itself as a field", function() {
	const wiki = getWiki();
	wiki.addTiddlers([{title: 'from', from: "Content"}]);
	wiki.renameTiddler("from", "to");
	expect(wiki.tiddlerExists('from')).toBe(false);
	expect(wiki.getTiddler('to').fields.to).toBe("Content");
});

(utils.atLeastVersion('5.2.0')? it : xit)
("can relink field name even if field value impossible", function() {
	const wiki = getWiki();
	const to = "to]] val";
	const fromConf = utils.fieldConf("from", "list");
	wiki.addTiddlers([
		{title: 'test', from: "Content contains from"},
		{title: 'from'},
		fromConf]);
	utils.spyFailures(spyOn);
	wiki.renameTiddler("from", to);
	expect(wiki.getTiddler('test').fields.from).toBeUndefined();
	expect(wiki.getTiddler('test').fields[to]).toBe("Content contains from");
	expect(utils.failures).toHaveBeenCalledTimes(1);
});

it('reports whitelist entries', function() {
	const wiki = getWiki();
	const conf = utils.fieldConf('test', 'filter');
	wiki.addTiddlers([
		conf,
		{title: 'test'}]);
	expect(utils.getReport(conf.title, wiki).test).toEqual(['#relink filter']);
	expect(wiki.filterTiddlers('[['+conf.title+']relink:references:hard[]]')).toEqual([]);
});

it("won't clobber existing whitelist entries", function() {
	const wiki = getWiki();
	const fromConf = utils.fieldConf("from", "list");
	const toConf = utils.fieldConf("to", "title");
	wiki.addTiddlers([
		{title: 'from'},
		fromConf, toConf]);
	utils.spyFailures(spyOn);
	wiki.renameTiddler("from", "to");
	// The whitelist entry should have been updated
	expect(utils.failures).toHaveBeenCalledTimes(1);
	expect(utils.failures.calls.first().args[0]).toEqual([fromConf.title]);
	expect(wiki.getTiddler(fromConf.title).fields.text).toBe("list");
	expect(wiki.getTiddler(toConf.title).fields.text).toBe("title");
});

it("won't touch plugins ever", function() {
	const wiki = utils.addPlugin("testPlugin", [{}], {description: "Anything", wiki: getWiki()});
	wiki.addTiddler({title: "description"});
	utils.spyFailures(spyOn);
	wiki.renameTiddler("description", "to");
	expect(wiki.getTiddler("testPlugin").fields.description).toBe("Anything");
	expect(wiki.getTiddler("testPlugin").fields.to).toBeUndefined();
	expect(utils.failures).toHaveBeenCalledTimes(1);
	expect(utils.failures.calls.first().args[0]).toEqual(['testPlugin']);
});

it("can relink into weird field names", function() {
	const wiki = getWiki();
	const string = 'This:has a colon';
	wiki.addTiddlers([
		{title: 'test', from: "content"},
		{title: 'from'}]);
	utils.spyFailures(spyOn);
	wiki.renameTiddler('from', string);
	if (utils.atLeastVersion('5.2.0')) {
		// This works in post v5.2.0
		expect(utils.failures).not.toHaveBeenCalled();
		expect(wiki.getTiddler('test').fields.from).toBeUndefined();
		expect(wiki.getTiddler('test').fields[string]).toBe('content');
	} else {
		// This doesn't in pre v5.2.0
		expect(utils.failures).toHaveBeenCalledTimes(1);
		expect(utils.failures.calls.first().args[0]).toEqual(['test']);
		expect(wiki.getTiddler('test').fields.from).toBe('content');
		expect(wiki.getTiddler('test').fields[string]).toBeUndefined();
	}
});

it('can change capitalization', function() {
	const wiki = getWiki();
	wiki.addTiddlers([
		{title: 'test', from: "content"},
		{title: 'from'}]);
	utils.spyFailures(spyOn);
	wiki.renameTiddler('from', 'From');
	if (utils.atLeastVersion('5.2.0')) {
		// This works in post v5.2.0
		expect(utils.failures).not.toHaveBeenCalled();
		expect(wiki.getTiddler('test').fields.from).toBeUndefined();
		expect(wiki.getTiddler('test').fields.From).toBe('content');
	} else {
		// This doesn't in pre v5.2.0
		expect(utils.failures).toHaveBeenCalledTimes(1);
		expect(utils.failures.calls.first().args[0]).toEqual(['test']);
		expect(wiki.getTiddler('test').fields.from).toBe('content');
		expect(wiki.getTiddler('test').fields.From).toBeUndefined();
	}
});

function testText(text, expected, report, options) {
	options = Object.assign({from: 'from', to: 'to'}, options);
	const wiki = options.wiki || getWiki();
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

it('can handle filter operators', function() {
	const wiki = getWiki();
	wiki.addTiddler(utils.operatorConf("has", "fieldname"));
	testText("{{{ [has[from]] }}}", true, ['{{{[has[]]}}}'], {wiki: wiki});
	utils.spyFailures(spyOn);
	testText("{{{ [has[from]] }}}", false, ['{{{[has[]]}}}'], {wiki: wiki, to: 'to]]here'});
	expect(utils.failures).toHaveBeenCalledTimes(1);
	utils.failures.calls.reset();
	testText("{{{ [has[from]] }}}", false, ['{{{[has[]]}}}'], {wiki: wiki, to: 'title'});
	expect(utils.failures).toHaveBeenCalledTimes(1);
});

it('can handle fieldnamelists', function() {
	const wiki = getWiki();
	wiki.addTiddler(utils.operatorConf("fields", "fieldnamelist"));
	testText("{{{ [fields[other from else]] }}}", true, ['{{{[fields[]]}}}'], {wiki: wiki});
	testText("{{{ [fields[other else]] }}}", false, undefined, {wiki: wiki});
	// Reserved fieldnames
	testText("{{{ [fields[other text else]] }}}", false, undefined, {wiki: wiki, from: 'text'});
	// List can't use brackets inside operators. Fail
	utils.spyFailures(spyOn);
	testText("{{{ [fields[other from else]] }}}", false, ['{{{[fields[]]}}}'], {wiki: wiki, to: "to there"});
	expect(utils.failures).toHaveBeenCalledTimes(1);
	utils.failures.calls.reset();
	// Reserved fieldnames that fail
	testText("{{{ [fields[other from else]] }}}", false, ['{{{[fields[]]}}}'], {wiki: wiki, from: 'from', to: "text"});
	expect(utils.failures).toHaveBeenCalledTimes(1);
	// Handles failure of internal list format
	utils.failures.calls.reset();
	testText("{{{ [fields[other from else]] }}}", false, ['{{{[fields[]]}}}'], {wiki: wiki, to: "to]] there"});
	expect(utils.failures).toHaveBeenCalledTimes(1);
});

it('can handle transcludes', function() {
	testText("{{tid!!from}}", true, ['{{tid!!}}']);
	testText("{{tid!!from}}", "<$tiddler tiddler=tid><$transclude tiddler=tid field=t|o/></$tiddler>", ['{{tid!!}}'], {to: "t|o"});
	testText("{{tid!!from}}", "<$tiddler tiddler=tid><$transclude tiddler=tid field=t{o/></$tiddler>", ['{{tid!!}}'], {to: "t{o"});
	testText("{{tid!!from}}", "<$tiddler tiddler=tid><$transclude tiddler=tid field=t}o/></$tiddler>", ['{{tid!!}}'], {to: "t}o"});
});

it('can handle transcludes where both title and field changed', function() {
	testText("{{from!!from}}", true, ['{{from!!}}', '{{!!from}}']);
	testText("{{from!!from}}", "<$tiddler tiddler=t!!o>{{!!t!!o}}</$tiddler>", ['{{from!!}}', '{{!!from}}'], {to: "t!!o"});
	// One final hard test
	const wiki = getWiki();
	wiki.addTiddler(utils.attrConf("$tiddler", "tiddler"));
	testText("{{from!!from}}", "<$tiddler tiddler=}o><$transclude tiddler=}o field=}o/></$tiddler>", ['{{from!!}}', '{{!!from}}'], {to: "}o"});
});

it('can handle indirect references', function() {
	testText("<$w a={{tid!!from}}/>", true, ['<$w a={{tid!!}} />']);
	testText("<$w a={{!!from}}/>", true, ['<$w a={{!!}} />']);
	testText("<$w a={{tid!!from}}/>", true, ['<$w a={{tid!!}} />'], {to: "t{o"});
	testText("<$w a={{tid!!from}}/>", true, ['<$w a={{tid!!}} />'], {to: "t|o"});
	utils.spyFailures(spyOn);
	testText("<$w a={{tid!!from}}/>", false, ['<$w a={{tid!!}} />'], {to: "t}o"});
	expect(utils.failures).toHaveBeenCalledTimes(1);
});

it('can handle indirect references where title and field change', function() {
	testText("<$w a={{from!!from}}/>", true, ['<$w a={{from!!}} />', '<$w a={{!!from}} />']);
	utils.spyFailures(spyOn);
	testText("<$w a={{from!!from}}/>", false, ['<$w a={{from!!}} />', '<$w a={{!!from}} />'], {to: "t}o"});
	expect(utils.failures).toHaveBeenCalledTimes(1);
	testText("<$w a={{from!!from}}/>", "<$w a={{from!!from}}/>", ['<$w a={{from!!}} />', '<$w a={{!!from}} />'], {to: "t!!o"});
	expect(utils.failures).toHaveBeenCalledTimes(2);
});

it('can handle operands of reference type', function() {
	const wiki = getWiki();
	wiki.addTiddler(utils.operatorConf("list", "reference"));
	testText('{{{ [list[tiddler!!from]] }}}', true, ['{{{[list[tiddler!!]]}}}'], {wiki: wiki});
	testText('{{{ [list[tiddler!!from]] }}}', true, ['{{{[list[tiddler!!]]}}}'], {wiki: wiki, to: 't}o'});
	utils.spyFailures(spyOn);
	testText('{{{ [list[tiddler!!from]] }}}', false, ['{{{[list[tiddler!!]]}}}'], {wiki: wiki, to: 't]o'});
	expect(utils.failures).toHaveBeenCalledTimes(1);
});

it('can handle transcludes in fields or attribute string values', function() {
	const wiki = getWiki();
	wiki.addTiddler(utils.attrConf("$button", "set", "reference"));
	testText('<$button set="tid!!from"/>', true, ['<$button set="tid!!" />'], {wiki: wiki, to: "to!!this"});
	testText('<$button set="tid!!from"/>', true, ['<$button set="tid!!" />'], {wiki: wiki, to: "to this"});
});

it('can rename widget attribute names', function() {
	const wiki = getWiki();
	const prefix = "$:/config/flibbles/relink/fieldattributes/";
	wiki.addTiddlers([
		utils.fieldConf("hotfield"),
		$tw.wiki.getTiddler(prefix + "$action-createtiddler"),
		$tw.wiki.getTiddler(prefix + "$jsontiddler")]);
	// Test that all attribute value types work
	testText("<$action-createtiddler from  =  'value' />", true,
	         ['<$action-createtiddler ="value" />'], {wiki: wiki});
	testText("<$action-createtiddler from={{value!!field}} />", true,
	         ['<$action-createtiddler ={{value!!field}} />'], {wiki: wiki});
	testText("<$action-createtiddler from={{{ [[value]get[field]] }}} />", true,
	         ['<$action-createtiddler ={{{[[value]get[field]]}}} />'], {wiki: wiki});
	testText("<$action-createtiddler from=<<value>> />", true,
	         ['<$action-createtiddler =<<value>> />'], {wiki: wiki});
	// Slightly trickier macrocall attribute name
	testText("<$action-createtiddler fr<om=<<value>> />", true,
	         ['<$action-createtiddler =<<value>> />'], {from: "fr<om", wiki: wiki});
	// Works when attribute name doesn't exactly match title
	testText("<$jsontiddler $from='value' />", true,
	         ['<$jsontiddler ="value" />'], {wiki: wiki});
	testText("<$jsontiddler $$from=value />", false, undefined, {wiki: wiki});
	testText("<$jsontiddler from=value />", false, undefined, {wiki: wiki});
	testText("<$jsontiddler myfrom=value />", false, undefined, {wiki: wiki});
	testText("<$jsontiddler fromhere=value />", false, undefined, {wiki: wiki});
	// Too long a value length
	const string = "This is an excessively long value to have as a field";
	testText("<$jsontiddler $from='"+string+"' />", true,
	         ['<$jsontiddler ="'+string.substr(0, maxLength)+'..." />'], {wiki: wiki});
	testText("<$jsontiddler $from =    <<"+string+">> />", true,
	         ['<$jsontiddler =<<'+string.substr(0, maxLength)+'...>> />'], {wiki: wiki});
	testText("<$jsontiddler $from={{{"+string+"}}} />", true,
	         ['<$jsontiddler ={{{'+string.substr(0, maxLength)+'...}}} />'], {wiki: wiki});
	// Newlines or tabs exist in value
	testText('<$jsontiddler $from="""\n\tStart of a new line\n\tStart of another line""" />', true,
	         ['<$jsontiddler ="Start of a new line Start of a..." />'], {wiki: wiki});
	// Attribute name and value must change
	testText("<$jsontiddler $hotfield='hotfield' />", true,
	         ['<$jsontiddler $hotfield />', '<$jsontiddler ="hotfield" />'],
	         {wiki: wiki, from: "hotfield"});
	// Respects blacklist
	testText("<$action-createtiddler text=value />", false,
	         undefined, {from: "text", wiki: wiki});
	utils.spyFailures(spyOn);
	testText("<$action-createtiddler from=value />", false,
	         ['<$action-createtiddler ="value" />'], {to: "text", wiki: wiki});
	expect(utils.failures).toHaveBeenCalledTimes(1);
	// new attribute name wouldn't match regexp
	utils.failures.calls.reset();
	testText("<$action-createtiddler from=value />", false,
	         ['<$action-createtiddler ="value" />'], {to: "$to", wiki: wiki});
	expect(utils.failures).toHaveBeenCalledTimes(1);
	// Matches regexp, but isn't a legal attribute name
	utils.failures.calls.reset();
	testText("<$action-createtiddler from=value />", false,
	         ['<$action-createtiddler ="value" />'], {to: "to here", wiki: wiki});
	expect(utils.failures).toHaveBeenCalledTimes(1);
	// Failure does not prevent the rest of the html from relinking
	utils.failures.calls.reset();
	testText("<$jsontiddler $from=value val={{from}} />",
	         "<$jsontiddler $from=value val={{to there}} />",
	         ['<$jsontiddler val={{}} />', '<$jsontiddler ="value" />'],
	         {to: "to there", wiki: wiki});
	expect(utils.failures).toHaveBeenCalledTimes(1);
});

it('handles operator suffixes', function() {
	const wiki = getWiki();
	const prefix = "$:/config/flibbles/relink/suffixes/";
	wiki.addTiddlers([
		utils.operatorConf('contains'),
		{title: prefix + 'myref', text: 'reference'},
		$tw.wiki.getTiddler(prefix + "contains")]);
	testText("{{{ A [contains:from[text]] }}}", true, ['{{{[contains:[text]]}}}'], {to: "to", wiki: wiki});
	testText("{{{ A [contains:from[text]] }}}", true, ['{{{[contains:[text]]}}}'], {to: "to there", wiki: wiki});
	testText("{{{ A [contains:from[text]] }}}", true, ['{{{[contains:[text]]}}}'], {to: "to,there", wiki: wiki});
	testText("{{{ A [contains:from[text]] }}}", true, ['{{{[contains:[text]]}}}'], {to: "to:there", wiki: wiki});
	// Multiple operands
	testText("{{{ A [contains:from[text],<other>] }}}", true, ['{{{[contains:[text],<other>]}}}'], {to: "to", wiki: wiki});
	// Very long operands are truncated
	const string = "This is an excessively long value to have as a field.";
	testText("{{{ A [contains:from["+string+"]] }}}", true, ['{{{[contains:['+string.substr(0,maxLength)+'...]]}}}'], {to: "to", wiki: wiki});
	testText("{{{ A [contains:from<"+string+">] }}}", true, ['{{{[contains:<'+string.substr(0,maxLength)+'...>]}}}'], {to: "to", wiki: wiki});
	testText("{{{ A [contains:from{"+string+"}] }}}", true, ['{{{[contains:{'+string.substr(0,maxLength)+'...}]}}}'], {to: "to", wiki: wiki});
	// can read strange fields from suffixes too
	testText("{{{ A [contains:from, here[text]] }}}", true, ['{{{[contains:[text]]}}}'], {to: "to", from: "from, here", wiki: wiki});
	// Can have weird suffix types like lists
	testText("{{{ A [myref:from!!field[x]] }}}", true, ['{{{[myref:!!field[x]]}}}'], {from: "from", wiki: wiki});
	testText("{{{ A [myref:tid!!from[x]] }}}", true, ['{{{[myref:tid!![x]]}}}'], {from: "from", wiki: wiki});
	// Tests brackets are safe
	testText("{{{ A [contains:from[text]] }}}", "<$list filter=' A [contains:to}}}there[text]] '/>", ['{{{[contains:[text]]}}}'], {to: "to}}}there", wiki: wiki});
	// Ultimate test: suffix and operands
	testText("{{{ A [contains:from[from]] }}}", true, ['{{{[contains:from[]]}}}', '{{{[contains:[from]]}}}'], {to: "to", wiki: wiki});
	// Reserved keywords
	testText("{{{ A [contains:text[a]] }}}", false, undefined, {from: 'text', to: "to", wiki: wiki});
	utils.spyFailures(spyOn);
	testText("{{{ A [contains:from[a]] }}}", false, ['{{{[contains:[a]]}}}'], {from: 'from', to: "text", wiki: wiki});
	expect(utils.failures).toHaveBeenCalledTimes(1);
	// Errors coming from within the suffix are handled
	utils.failures.calls.reset();
	testText("{{{ A [myref:from!!field[x]] }}}", false, ['{{{[myref:!!field[x]]}}}'], {from: "from", to: "t!!o", wiki: wiki});
	expect(utils.failures).toHaveBeenCalledTimes(1);
	// Brackets aren't compatible though
	utils.failures.calls.reset();
	testText("{{{ A [contains:from[text]] }}}", false, ['{{{[contains:[text]]}}}'], {to: "to[there", wiki: wiki});
	testText("{{{ A [contains:from[text]] }}}", false, ['{{{[contains:[text]]}}}'], {to: "to<there", wiki: wiki});
	testText("{{{ A [contains:from[text]] }}}", false, ['{{{[contains:[text]]}}}'], {to: "to{there", wiki: wiki});
	testText("{{{ A [contains:from[text]] }}}", false, ['{{{[contains:[text]]}}}'], {to: "to/there", wiki: wiki});
	expect(utils.failures).toHaveBeenCalledTimes(4);
});

it('can handle "contains" operators', function() {
	const prefix = "$:/config/flibbles/relink/suffixes/";
	const wiki = getWiki();
	wiki.addTiddlers([
		utils.fieldConf('from', 'list'),
		$tw.wiki.getTiddler(prefix + 'contains')]);
	testText("{{{ [contains:from[from]] }}}", true, ['{{{[contains:from[]]}}}', '{{{[contains:[from]]}}}'], {wiki: wiki});
});

it('can handle "search" operators', function() {
	// default report
	const report = ["{{{[search:[x]]}}}"];
	const invertReport = ["{{{[search:-[x]]}}}"];
	// First test that reporting operands works fine
	const string = "This is an excessively long value to have as a field.";
	testText("{{{ [search:from["+string+"]] }}}", true, ['{{{[search:['+string.substr(0,maxLength)+'...]]}}}']);
	testText("{{{ [search:from<"+string+">] }}}", true, ['{{{[search:<'+string.substr(0,maxLength)+'...>]}}}']);
	testText("{{{ [search:from{"+string+"}] }}}", true, ['{{{[search:{'+string.substr(0,maxLength)+'...}]}}}']);
	// location in suffix
	testText("{{{ [search:cat,from,love[x]] }}}", true, report);
	testText("{{{ [search:cat:from[x]] }}}", false);
	testText("{{{ [search:from:literal,some[x]] }}}", true, ['{{{[search::literal,some[x]]}}}']);
	testText("{{{ [search:-from[x]] }}}", true, invertReport);
	testText("{{{ [search:-cat,from[x]] }}}", true, invertReport);
	// Not there at all
	testText("{{{ [search[x]] }}}", false);
	testText("{{{ [search::literal[x]] }}}", false);
	// asterisk and minus are okay in some circumstances
	testText("{{{ [search:cat,from[x]] }}}", true, report, {to: '-to'});
	testText("{{{ [search:cat,from[x]] }}}", true, report, {to: '*'});
	testText("{{{ [search:from[x]] }}}", true, report, {to: '*to'});
	testText("{{{ [search:*from[x]] }}}", true, report, {from: '*from'});
	testText("{{{ [search:*[x]] }}}", false, undefined, {from: '*'});
	testText("{{{ [search:cat,*[x]] }}}", true, report, {from: '*'});
	testText("{{{ [search:-from[x]] }}}", false, undefined, {from: '-from'});
	testText("{{{ [search:cat,-from[x]] }}}", true, report, {from: '-from'});
	testText("{{{ [search:--from[x]] }}}", true, invertReport, {from: '-from'});
	testText("{{{ [search:-from[x]] }}}", true, invertReport, {to: '-to'});
	testText("{{{ [search:-*[x]] }}}", true, invertReport, {from: '*'});
	testText("{{{ [search:-from[x]] }}}", true, invertReport, {to: '*'});
	// Reserved field names
	testText("{{{ [search:text[x]] }}}", false, undefined, {from: 'text', wiki: getWiki()});
	utils.spyFailures(spyOn);
	function testFail(input, expected, report, options) {
		utils.failures.calls.reset();
		testText(input, expected, report, options);
		expect(utils.failures).toHaveBeenCalledTimes(1);
	};
	testFail("{{{ [search:from[x]] }}}", false, report, {to: 'text', wiki: getWiki()});
	testFail("{{{ [search:from[x]] }}}", false, report, {to: 't,o'});
	testFail("{{{ [search:from[x]] }}}", false, report, {to: 't:o'});
	testFail("{{{ [search:from[x]] }}}", false, report, {to: 't[o'});
	testFail("{{{ [search:from[x]] }}}", false, report, {to: 't<o'});
	testFail("{{{ [search:from[x]] }}}", false, report, {to: 't{o'});
	testFail("{{{ [search:from[x]] }}}", false, report, {to: 't/o'});
	testFail("{{{ [search:from[x]] }}}", false, report, {to: '-to'});
	testFail("{{{ [search:from[x]] }}}", false, report, {to: '*'});
});

it('handles field name filter operators', function() {
	testText("{{{ A [from[value]] }}}", true, ['{{{[field:[value]]}}}']);
	testText("{{{ A [from[value]] }}}", true, ['{{{[field:[value]]}}}'], {to: "A weird' but \"legal\" ]title"});
	testText("{{{ A [from[value]] }}}", "{{{ A [field:addprefix[value]] }}}", ['{{{[field:[value]]}}}'], {to: 'addprefix'});
	testText("{{{ A [from[value]] }}}", "{{{ A [field:to:there[value]] }}}", ['{{{[field:[value]]}}}'], {to: 'to:there'});
	testText("{{{ A [addprefix[value]] }}}", false, undefined, {from: 'addprefix'});
	// Ultimate test
	const wiki = getWiki();
	wiki.addTiddler(utils.fieldConf("from"));
	testText("{{{ A [from[from]] }}}", true, ['{{{[from[]]}}}', '{{{[field:[from]]}}}'], {wiki: wiki});
	// Ignores reserved fieldnames
	testText("{{{ A [text[value]] }}}", false, undefined);
	utils.spyFailures(spyOn);
	testText("{{{ A [from[value]] }}}", false, ['{{{[field:[value]]}}}'], {to: "text"});
	expect(utils.failures).toHaveBeenCalledTimes(1);
	// Handles errors
	utils.failures.calls.reset();
	testText("{{{ A [from[value]] }}}", false, ['{{{[field:[value]]}}}'], {to: "to[there"});
	testText("{{{ A [from[value]] }}}", false, ['{{{[field:[value]]}}}'], {to: "to<there"});
	testText("{{{ A [from[value]] }}}", false, ['{{{[field:[value]]}}}'], {to: "to{there"});
	testText("{{{ A [from[value]] }}}", false, ['{{{[field:[value]]}}}'], {to: "to/there"});
	expect(utils.failures).toHaveBeenCalledTimes(4);
});

});
