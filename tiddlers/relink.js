/*\
tags: $:/tags/test-spec
title: test/relink.js
type: application/javascript
module-type: test.relink

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
	expect(t.fields[field].toString()).toEqual(expected.toString());
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

it('still relinks tags', function() {
	var log = [];
	var t = testTags("[[from here]] another",
	                 ['to there', 'another'], {log: log});
	expect(log).toEqual(["Renaming tag 'from here' to 'to there' of tiddler 'test'"]);
});

it('still relinks lists', function() {
	var log = [];
	var t = testList("[[from here]] another",
	                 ['to there', 'another'], {log: log});
	expect(log).toEqual(["Renaming list item 'from here' to 'to there' of tiddler 'test'"]);
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
	expect(log).toEqual(["Renaming test field 'from here' to 'to there' of tiddler 'test'"]);
});

it('relinks custom list', function() {
	var log = [];
	var t = testField("A [[from here]] B", {type: "list", log: log});
	expect(log).toEqual(["Renaming test item 'from here' to 'to there' of tiddler 'test'"]);
});

it('ignores blank custom field settings', function() {
	testField("ignore", {type: "", ignored: true, from: "ignore"});
});

it('ignores unrecognized custom field settings', function() {
	testField("ignore", {type: "bizarre", ignored: true, from: "ignore"});
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
	expect(log).toEqual(["Renaming testlist item 'from here' to 'to there' of tiddler 'test'"]);
});
*/

});

