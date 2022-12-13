/*\

Handles replacement in $macrocall widgets

\*/

exports.name = "macrocall";

exports.report = function(element, parser, callback, options) {
	if (element.tag === "$macrocall") {
		var nameAttr = element.attributes["$name"];
		if (nameAttr) {
			var macro = parser.context.getMacro(nameAttr.value);
			for (var attributeName in element.attributes) {
				var attr = element.attributes[attributeName];
				if (attr.type === "string") {
					var handler = macro[attributeName];
					if (handler) {
						handler.report(attr.value, function(title, blurb) {
							if (blurb) {
								callback(title, element + ' ' + attributeName + '="' + blurb + '"');
							} else {
								callback(title, element + ' ' + attributeName);
							}
						}, options);
					}
				}
			}
		}
	}
};

exports.relink = function(element, parser, fromTitle, toTitle, options) {
	return;
	if (element.tag === "$macrocall") {
		var nameAttr = element.attributes["$name"];
		if (nameAttr) {
			var macro = context.getMacro(nameAttr.value);
			for (var attributeName in element.attributes) {
				var attr = this.nextTag.attributes[attributeName];
				if (attr.type === "string") {
					var handler = macro[attributeName];
					if (handler) {
						var entry = handler.relink(attr.value, fromTitle, toTitle, nestedOptions);
						if (entry === undefined) {
							continue;
						}
						if (entry.output) {
							var quote = utils.determineQuote(text, attr);
							oldLength = attr.value.length + (quote.length * 2);
							quotedValue = utils.wrapAttributeValue(entry.output,quote);
							if (quotedValue === undefined) {
								// The value was unquotable. We need to make
								// a macro in order to replace it.
								if (!options.placeholder) {
									// but we can't...
									entry.impossible = true;
								} else {
									var value = options.placeholder.getPlaceholderFor(entry.output,handler.name)
									quotedValue = "<<"+value+">>";
								}
							}
							attr.value = entry.output;
						}
					}
				}
			}
		}
	}
};
