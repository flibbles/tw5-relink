/*\
title: relink.js
type: application/javascript
module-type: test.relink

Tests the new relinking wiki methods.

\*/
$tw.describe('relink', function() {
var it = $tw.it;

var expect = require('chai').expect;
var logs;

function collectLogs(scope) {
	var oldLog = console.log,
		logMessages = [];
	console.log = function (message) { logMessages.push(message); };
	try {
		scope.call();
	} finally {
		console.log = oldLog;
	}
	return logMessages;
};

function relink(fields, options) {
	var relinkedTiddler;
	options = options || {};
	var wiki = options.wiki || new $tw.Wiki();
	var from = options.from || "from here";
	var to = options.to || "to there";
	wiki.addTiddler({title: from});
	logs = collectLogs(function() {
		var tiddler = new $tw.Tiddler({title: "test"}, fields);
		var title = tiddler.fields.title;
		wiki.addTiddler(tiddler);
		wiki.renameTiddler(from, to, options);
		relinkedTiddler = wiki.getTiddler(title);
	});
	return relinkedTiddler;
};

it("doesn't touch ineligible tiddlers", function() {
	var t = relink({tags: "nothing here", list: "other stuff"});
	expect(t.fields).to.not.include.key('modified');
});

it("touches eligible tiddlers", function() {
	var t = relink({tags: "[[from here]]"});
	expect(t.fields).to.include.key('modified');
});

it('still relinks tags', function() {
	var t = relink({"tags": "[[from here]] another"});
	expect(t.fields.tags).to.eql(['to there', 'another']);
	expect(logs).to.eql(["Renaming tag 'from here' to 'to there' of tiddler 'test'"]);
});

it('still respects dontRenameInTags', function() {
	var t = relink({"tags": "[[from here]] another"}, {dontRenameInTags: true});
	expect(t.fields.tags).to.eql(['from here', 'another']);
});

it('still relinks lists', function() {
	var t = relink({"list": "[[from here]] another"});
	expect(t.fields.list).to.eql(['to there', 'another']);
	expect(logs).to.eql(["Renaming list item 'from here' to 'to there' of tiddler 'test'"]);
});

it('still respects dontRenameInLists', function() {
	var t = relink({"list": "[[from here]] another"}, {dontRenameInLists: true});
	expect(t.fields.list).to.eql(['from here', 'another']);
});

it('relinks custom field', function() {
	var title =  "$:/config/flibbles/relink/fields/testUndef";
	var wiki = new $tw.Wiki();
	wiki.addTiddler({"title": title, "text": "field"});
	var t = relink({"testUndef": "from here"}, {wiki: wiki});
	expect(t.fields.testUndef).to.equal('to there');
	expect(logs).to.eql(["Renaming testUndef field 'from here' to 'to there' of tiddler 'test'"]);
});

it('relinks custom list', function() {
	var title =  "$:/config/flibbles/relink/fields/customList";
	var wiki = new $tw.Wiki();
	wiki.addTiddler({"title": title, "text": "list"});
	var t = relink({"customList": "A [[from here]] B"}, {wiki: wiki});
	expect(t.fields.customList).to.equal('A [[to there]] B');
	expect(logs).to.eql(["Renaming customList item 'from here' to 'to there' of tiddler 'test'"]);
});

it('relinks installed tiddlerfield field', function() {
	var t = relink({"testfield": "from here"});
	expect(t.fields.testfield).to.equal('to there');
	expect(logs).to.eql(["Renaming testfield field 'from here' to 'to there' of tiddler 'test'"]);
});

it('relinks installed tiddlerfield list', function() {
	var t = relink({"testlist": "[[from here]] another"});
	expect(t.fields.testlist).to.eql(['to there', 'another']);
	expect(logs).to.eql(["Renaming testlist item 'from here' to 'to there' of tiddler 'test'"]);
});

it('relinks installed tiddlerfield stringlist', function() {
	var t = relink({"teststringlist": "[[from here]] another"});
	expect(t.fields.teststringlist).to.equal('[[to there]] another');
	expect(logs).to.eql(["Renaming teststringlist item 'from here' to 'to there' of tiddler 'test'"]);
});

$tw.describe("filter fields", function() {

function testFilter(filter, expected, options) {
	var title = "$:/config/flibbles/relink/fields/customFilter";
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: title, text: "filter"});
	options = options || {};
	options.wiki = wiki;
	var t = relink({customFilter: filter}, options);
	expect(t.fields.customFilter).to.equal(expected);
};

it('relinks and logs', function() {
	testFilter("A [[from here]] B", 'A [[to there]] B');
	expect(logs).to.eql(["Renaming customFilter operand 'from here' to 'to there'"]);
});

it('quotes', function() {
	testFilter("A 'from here' B", "A 'to there' B");
	testFilter('A "from here" B', 'A "to there" B');
});

it('nonquotes', function() {
	testFilter("A from B", "A to B", {from: 'from', to: 'to'});
});

it('keeps brackets', function() {
	testFilter("A [[from]] B", "A [[to]] B", {from: 'from', to: 'to'});
});

it('added spaces', function() {
	testFilter("A from B", "A [[to there]] B",{from: 'from'});
});

it('removed spaces', function() {
	testFilter("A [[from here]] B", "A to B",{to: 'to'});
	testFilter("A [[from here]]B", "A [[to]]B",{to: 'to'});
	testFilter("A[[from here]] B", "A[[to]] B",{to: 'to'});
	testFilter("[[from here]] B", "to B",{to: 'to'});
	testFilter("A [[from here]]", "A to",{to: 'to'});
});

it('multiples', function() {
	testFilter("A [[f]] f B", 'A [[to there]] [[to there]] B', {from: "f"});
});

it('runs', function() {
	testFilter("[tag[a][a]has[a]]", '[tag[a][to there]has[a]]', {from: "a"});
});

it('title operator', function() {
	testFilter("A [title[from here]] B", 'A [title[to there]] B');
	testFilter("A [title[from]] B", 'A [title[to there]] B',{from: 'from'});
});

it('ignores other operators', function() {
	testFilter("A [has[from here]] B", 'A [has[from here]] B');
	testFilter("A [field:other[from here]] B", 'A [field:other[from here]] B');
});

it('ignores variables', function() {
	testFilter("A [title<from>] B", 'A [title<from>] B', {from: "from"});
	testFilter("A [<from>] B", 'A [<from>] B', {from: "from"});
});

it('ignores regular expressions', function() {
	testFilter("A [title/from/] B", 'A [title/from/] B', {from: "from"});
	testFilter("[regexp/rxp/] [[from here]] B", '[regexp/rxp/] [[to there]] B');
});

// In theory, we could have support for this, but not now.
it('ignores transclusion', function() {
	testFilter("A [title{from}] B", 'A [title{from}] B', {from: "from"});
	testFilter("A [{from}] B", 'A [{from}] B', {from: "from"});
});

it('field:title operator', function() {
	testFilter("A [field:title[from here]] B", 'A [field:title[to there]] B');
});

});

});
