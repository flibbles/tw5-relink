/*\
module-type: widget

Creates a mangler widget for field validation. This isn't meant to be used
by the user. It's only used in Relink configuration.

\*/

var Widget = require("$:/core/modules/widgets/widget.js").widget;
var language = require('$:/plugins/flibbles/relink/js/language.js');

var RelinkManglerWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
	this.addEventListeners([
		{type: "relink-add-field", handler: "handleAddFieldEvent"}
	]);
};

exports.relinkmangler = RelinkManglerWidget;

RelinkManglerWidget.prototype = new Widget();

RelinkManglerWidget.prototype.handleAddFieldEvent = function(event) {
	var paramObject = event.paramObject;
	if (typeof paramObject !== "object") {
		// Can't handle it.
		return true;
	}
	var trimmedName = paramObject.field.toLowerCase().trim();
	if(!$tw.utils.isValidFieldName(trimmedName)) {
		language.alert($tw.language.getString(
			"InvalidFieldName",
			{variables:
				{fieldName: trimmedName}
			}
		));
	} else {
		var def = getDefaultType(this.wiki);
		this.wiki.addTiddler({title: "$:/config/flibbles/relink/fields/" + trimmedName, text: def});
	}
	return true;
};

function getDefaultType(wiki) {
	var tiddler = wiki.getTiddler("$:/config/flibbles/relink/settings/default-type");
	if (tiddler) {
		return tiddler.fields.text;
	} else {
		return "title";
	}
};
