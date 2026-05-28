/*\

Handles state updating required for $importvariables widgets

\*/

var relinkUtils = require('$:/plugins/flibbles/relink/js/utils.js');
var ImportContext = relinkUtils.getContext('import');

exports.name = "importvariables";

exports.report = function(element, parser, callback, options) {
	if (element.tag === "$importvariables") {
		processImport(element, parser, options);
	}
};

exports.relink = function(element, parser, fromTitle, toTitle, options) {
	if (element.tag === "$importvariables") {
		processImport(element, parser, options);
	}
};

function processImport(element, parser, options) {
	var importFilterAttr = element.attributes.filter;
	if (importFilterAttr) {
		processImportFilter(parser, importFilterAttr, options);
	}
};

// This processes a <$importvariables> filter attribute and adds any new
// variables to our parser.
function processImportFilter(parser, importAttribute, options) {
	if (typeof importAttribute === "string") {
		// It was changed. Reparse it. It'll be a quoted
		// attribute value. Add a dummy attribute name.
		importAttribute = $tw.utils.parseAttribute("p="+importAttribute, 0)
	}
	var context = parser.context;
	var importFilter = computeAttribute(context, importAttribute, options);
	parser.context = new ImportContext(options.wiki, context, importFilter);
};

function computeAttribute(context, attribute, options) {
	var value;
	if(attribute.type === "filtered") {
		var parentWidget = context.widget;
		value = options.wiki.filterTiddlers(attribute.filter,parentWidget)[0] || "";
	} else if(attribute.type === "indirect") {
		var parentWidget = context.widget;
		value = options.wiki.getTextReference(attribute.textReference,"",parentWidget.variables.currentTiddler.value);
	} else if(attribute.type === "macro") {
		var parentWidget = context.widget;
		var params = makeSuitableParams(parentWidget, attribute.value);
		value = parentWidget.getVariable(attribute.value.name,{params: params});
	} else { // String attribute
		value = attribute.value;
	}
	return value;
};

function makeSuitableParams(widget, macro) {
	if (macro.params) {
		var params = [];
		for (var i = 0; i < macro.params.length; i++) {
			var attr = macro.params[i];
			var param = {
				value: widget.computeAttribute(attr)
			};
			if (attr.name && !attr.isPositional) {
				param.name = attr.name;
			}
			params.push(param);
		}
		return params;
	}
	return macro.params;
};
