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

$tw.beforeEach("creates from", function() {
	$tw.wiki.addTiddler({"title": "from here"});
});

$tw.afterEach('remove to', function() {
	$tw.wiki.deleteTiddler('to there');
});

function relink(fields, options) {
	var relinkedTiddler;
	logs = collectLogs(function() {
		options = options || {};
		var tiddler = new $tw.Tiddler({"title": "test"}, fields);
		var title = tiddler.fields.title;
		$tw.wiki.addTiddler(tiddler);
		$tw.wiki.renameTiddler("from here", "to there", options);
		relinkedTiddler = $tw.wiki.getTiddler(title);
		$tw.wiki.deleteTiddler(title);
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

it('relinks custom undefined field', function() {
	var title =  "$:/config/flibbles/relink/fields/testUndef";
	$tw.wiki.addTiddler({"title": title});
	var t = relink({"testUndef": "from here"});
	$tw.wiki.deleteTiddler(title);
	expect(t.fields.testUndef).to.equal('to there');
	expect(logs).to.eql(["Renaming testUndef field 'from here' to 'to there' of tiddler 'test'"]);
});

it('relinks installed tiddlerfield field', function() {
	var t = relink({"testField": "from here"});
	expect(t.fields.testField).to.equal('to there');
	expect(logs).to.eql(["Renaming testField field 'from here' to 'to there' of tiddler 'test'"]);
});

it('relinks installed tiddlerfield list', function() {
	var t = relink({"testList": "[[from here]] another"});
	expect(t.fields.testList).to.eql(['to there', 'another']);
	expect(logs).to.eql(["Renaming testList item 'from here' to 'to there' of tiddler 'test'"]);
});

});
