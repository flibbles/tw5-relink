/*\
module-type: relinktextoperator

Ensure that the old relinktextoperator modules will still work, even if they
don't report anymore.

\*/

function LegacyEntry(output) {
	this.output = output;
};

LegacyEntry.prototype.name = 'legacy';

LegacyEntry.prototype.report = function() {
	return [this.output];
};

exports['text/x-legacy-text'] = function(tiddler, fromTitle, toTitle, options) {
	if (tiddler.fields.text === fromTitle) {
		return new LegacyEntry(toTitle);
	}
};
