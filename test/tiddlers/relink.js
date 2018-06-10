/*\
title: relink.js
type: application/javascript
module-type: test.relink

Tests the new relinking wiki methods.

\*/
$tw.describe('relink', function() {
var it = $tw.it;

var expect = require('chai').expect;
var wiki;
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

$tw.beforeEach("creates from", function() {
	wiki = new $tw.Wiki();
	wiki.addTiddler({"title": "from here"});
});

function relink(fields, options) {
	var relinkedTiddler;
	logs = collectLogs(function() {
		options = options || {};
		var tiddler = new $tw.Tiddler({"title": "test"}, fields);
		var title = tiddler.fields.title;
		wiki.addTiddler(tiddler);
		wiki.renameTiddler("from here", "to there", options);
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
	wiki.addTiddler({"title": title, "text": "field"});
	var t = relink({"testUndef": "from here"});
	expect(t.fields.testUndef).to.equal('to there');
	expect(logs).to.eql(["Renaming testUndef field 'from here' to 'to there' of tiddler 'test'"]);
});

it('relinks custom list', function() {
	var title =  "$:/config/flibbles/relink/fields/customList";
	wiki.addTiddler({"title": title, "text": "list"});
	var t = relink({"customList": "A [[from here]] B"});
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

});
