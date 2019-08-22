/*\
tags: $:/tags/test-spec
title: test/relink.js
type: application/javascript
module-type: test.relink

Tests the new relinking wiki methods.

\*/

var relink = require("test/utils").relink;

function fieldConf(field, type) {
	var prefix =  "$:/config/flibbles/relink/fields/";
	return {title: prefix + field, text: type};
};

describe('relink', function() {

it("doesn't touch ineligible tiddlers", function() {
	var t = relink({tags: "nothing here", list: "other stuff"});
	expect($tw.utils.hop(t.fields, 'modified')).toBe(false);
});

it("touches eligible tiddlers", function() {
	var t = relink({tags: "[[from here]]"});
	expect($tw.utils.hop(t.fields, 'modified')).toBe(true);
});

it('still relinks tags', function() {
	var log = [];
	var t = relink({"tags": "[[from here]] another"}, {log: log});
	expect(t.fields.tags.slice()).toEqual(['to there', 'another']);
	expect(log).toEqual(["Renaming tag 'from here' to 'to there' of tiddler 'test'"]);
});

it('still respects dontRenameInTags', function() {
	var t = relink({"tags": "[[from here]] another"}, {dontRenameInTags: true});
	expect(t.fields.tags.slice()).toEqual(['from here', 'another']);
});

it('still relinks lists', function() {
	var log = [];
	var t = relink({"list": "[[from here]] another"}, {log: log});
	expect(t.fields.list.slice()).toEqual(['to there', 'another']);
	expect(log).toEqual(["Renaming list item 'from here' to 'to there' of tiddler 'test'"]);
});

it('still respects dontRenameInLists', function() {
	var t = relink({"list": "[[from here]] another"}, {dontRenameInLists: true});
	expect(t.fields.list.slice()).toEqual(['from here', 'another']);
});

it('relinks custom field', function() {
	var log = [];
	var wiki = new $tw.Wiki();
	wiki.addTiddler(fieldConf("testUndef", "field"));
	var t = relink({"testUndef": "from here"}, {wiki: wiki, log: log});
	expect(t.fields.testUndef).toBe('to there');
	expect(log).toEqual(["Renaming testUndef field 'from here' to 'to there' of tiddler 'test'"]);
});

it('relinks custom list', function() {
	var log = [];
	var wiki = new $tw.Wiki();
	wiki.addTiddler(fieldConf("customList", "list"));
	var t = relink({"customList": "A [[from here]] B"}, {wiki: wiki, log: log});
	expect(t.fields.customList).toBe('A [[to there]] B');
	expect(log).toEqual(["Renaming customList item 'from here' to 'to there' of tiddler 'test'"]);
});

it('ignores blank custom field settings', function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler(fieldConf("ignoredList", ""));
	var t = relink({"ignoredList": "ignore"}, {wiki: wiki, from: "ignore"});
	expect(t.fields.ignoredList).toBe("ignore");
});

it('ignores unrecognized custom field settings', function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler(fieldConf("ignoredList", "bizarre"));
	var t = relink({"ignoredList": "ignore"}, {wiki: wiki, from: "ignore"});
	expect(t.fields.ignoredList).toBe("ignore");
});

it('relinks installed tiddlerfield field', function() {
	var log = [];
	var t = relink({"testfield": "from here"}, {log: log});
	expect(t.fields.testfield).toBe('to there');
	expect(log).toEqual(["Renaming testfield field 'from here' to 'to there' of tiddler 'test'"]);
});

it('relinks installed tiddlerfield list', function() {
	var log = [];
	var t = relink({"testlist": "[[from here]] another"}, {log: log});
	expect(t.fields.testlist.slice(0)).toEqual(['to there', 'another']);
	expect(log).toEqual(["Renaming testlist item 'from here' to 'to there' of tiddler 'test'"]);
});

it('relinks installed tiddlerfield stringlist', function() {
	var log = [];
	var t = relink({"teststringlist": "[[from here]] another"}, {log: log});
	expect(t.fields.teststringlist).toBe('[[to there]] another');
	expect(log).toEqual(["Renaming teststringlist item 'from here' to 'to there' of tiddler 'test'"]);
});

});

