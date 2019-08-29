/*\

Tests the new relinking wiki methods.

\*/

var utils = require("test/utils");
var relink = utils.relink;

function fieldConf(field, type) {
	var prefix =  "$:/config/flibbles/relink/fields/";
	return {title: prefix + field, text: type};
};

function testField(value, expected, options) {
	[value, expected, options] = utils.prepArgs(value, expected, options);
	var field = options.field || "test";
	var type = options.type;
	if (type === undefined) {
		type = "title";
	}
	options.wiki.addTiddler(fieldConf(field, type));
	var t = relink({[field]: value}, options);
	var output = t.fields[field];
	if (typeof output === "object") {
		output = Array.prototype.slice.call(output);
	}
	expect(output).toEqual(expected);
	return t;
};

function testTags(value, expectedArray, options) {
	return testField(value, expectedArray,
	                 Object.assign({field: "tags", type: "list"}, options));
};

function testList(value, expectedArray, options) {
	return testField(value, expectedArray,
	                 Object.assign({field: "list", type: "list"}, options));
};

describe('relink', function() {

it("doesn't touch ineligible tiddlers", function() {
	var t = testTags("nothing here",["nothing", "here"]);
	expect($tw.utils.hop(t.fields, 'modified')).toBe(false);
	t = testList("nothing here", ["nothing", "here"]);
	expect($tw.utils.hop(t.fields, 'modified')).toBe(false);
});

it("touches eligible tiddlers", function() {
	var t = testTags("[[from here]]", ["to there"]);
	expect($tw.utils.hop(t.fields, 'modified')).toBe(true);
});

it("handles errors with at least some grace", function() {
	function thrower(exception, expected) {
		var oldParseStringArray = $tw.utils.parseStringArray;
		var wiki = new $tw.Wiki();
		var e;
		wiki.addTiddlers([
			{title: "tiddlertest", test: "A"},
			fieldConf("test", "list")
		]);
		try {
			$tw.utils.parseStringArray = function() {
				throw new Error(exception);
			};
			wiki.renameTiddler("anything","something",{wiki: wiki});
		} catch (thrown) {
			e = thrown;
		} finally {
			$tw.utils.parseStringArray = oldParseStringArray;
		}
		expect(e).toBeDefined();
		expect(e.message).toEqual(expected);
	};
	//thrower("Ping", "Ping\nError relinking 'tiddlertest'");
	thrower('Boom', "Boom\nWhen relinking 'tiddlertest'");
});

it('still relinks tags', function() {
	var log = [];
	var t = testTags("[[from here]] another",
	                 ['to there', 'another'], {log: log});
	expect(log).toEqual(["Renaming 'from here' to 'to there' in tags of tiddler 'test'"]);
});

it('still relinks lists', function() {
	var log = [];
	var t = testList("[[from here]] another",
	                 ['to there', 'another'], {log: log});
	expect(log).toEqual(["Renaming 'from here' to 'to there' in list field of tiddler 'test'"]);
});

it('lists work with strange titles', function() {
	function works(title, wrapped) {
		//var expected = wrapped ? "A [["+title+"]] B" : "A "+title+" B";
		var expected = ["A", title, "B"];
		testList("A [[from here]] B", expected, {to: title});
	};
	works("weird]]");
	works("weird ]]");
	works("weird ]]");
	works("weird[[");
	works("weird [[");
	works("X[[Z]]Y");
	works("X [[ Z ]]Y", true);

	var thisFuckingValue = "weird ]]\xA0value";
	works(thisFuckingValue);
	// Just got to test that the crazy value is actually something
	// Tiddlywiki supports.  Seriously, when do these come up?
	var list = ["A", thisFuckingValue, "A tiddler", "B"];
	var strList = $tw.utils.stringifyList(list);
	var output = $tw.utils.parseStringArray(strList);
	expect(output).toEqual(list);
});

it('lists recognize impossibly strange titles', function() {
	function fails(title) {
		var options = {to: title, ignore: true,
		               field: "example", type: "list"};
		var list = "A [[from here]] B";
		testField(list, list, options);
		expect(options.fails.length).toEqual(1);
	};
	fails("X and]] Y");
	fails("]] X");
});

it("lists don't fail when toTitle not in list", function() {
	var options = {to: "X and]] Y", field: "list", type: "list"};
	testField("A B C", ["A", "B", "C"], options);
	expect(options.fails.length).toEqual(0);
});

/** I have chosen not to respect dontRenameInTags and dontRenameInLists
 *  because they are literally never used anywhere. Now you can just use
 *  the configuration.
 */
/*
it('still respects dontRenameInTags', function() {
	var t = relink({"tags": "[[from here]] another"}, {dontRenameInTags: true});
	expect(t.fields.tags.slice()).toEqual(['from here', 'another']);
});

it('still respects dontRenameInLists', function() {
	var t = relink({"list": "[[from here]] another"}, {dontRenameInLists: true});
	expect(t.fields.list.slice()).toEqual(['from here', 'another']);
});
*/

it('relinks custom field', function() {
	var log = [];
	var t = testField("from here", {log: log});
	expect(log).toEqual(["Renaming 'from here' to 'to there' in test field of tiddler 'test'"]);
});

it('relinks custom list', function() {
	var log = [];
	var t = testField("A [[from here]] B", {type: "list", log: log});
	expect(log).toEqual(["Renaming 'from here' to 'to there' in test field of tiddler 'test'"]);
});

it('ignores blank custom field settings', function() {
	testField("ignore", {type: "", ignored: true, from: "ignore"});
});

it('ignores unrecognized custom field settings', function() {
	testField("ignore", {type: "bizarre", ignored: true, from: "ignore"});
});

it('removes unnecessary brackets in custom list', function() {
	// The decision to remove brackets may be controversial, but since
	// list and tag automatically remove brackets on their own, I might
	// as well be consistent.
	testField("A [[from here]] B", "A to B", {type: "list", to: "to"});
	testField("A [[from]] B", "A to B",{type:"list", from:"from", to:"to"});
});

/**This is legacy support. The 'title' field type used to be called 'field'
 * But field was unhelpful. What's it mean when a field is set to 'field'?
 */
it('supports "field" field settings', function() {
	testField("from here", {type: "field"});
});

/*
it('relinks installed tiddlerfield list', function() {
	var log = [];
	var t = relink({"testlist": "[[from here]] another"}, {log: log});
	expect(t.fields.testlist.slice(0)).toEqual(['to there', 'another']);
	expect(log).toEqual(["Renaming 'from here' to 'to there' in testlist field of tiddler 'test'"]);
});
*/

});

