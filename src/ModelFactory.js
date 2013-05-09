var ModelFactory = {

	extend: function(options) {
		return function() {

			var Private = {
				attributes: {},
				setupAttributes: function() {
					for (var attribute in options.schema) {
						this.attributes[attribute] = {
							default: options.schema[attribute].default,
							value: options.schema[attribute].default,
							previous: undefined,
							validation: options.schema[attribute].validation
						};
						if (! Validator.prototype.set(this.attributes[attribute], this.attributes[attribute].value)) {
							console.warn('Attribute was setup with invalid default value');
						}
					}
				},
			};

			var Validator = function(model) {
				this.model = model;
			};

			Validator.prototype.options = function(options) {
				if (!options || !options.type || !options.schema) {
					EventPublisher.publish({
						eventName: 'ModelFactory.create.error.invalidOptions',
						data: {
							options: options
						}
					});
					return false;
					// throw new Error("Please provide type and attributes");
				} else {
					return true;
				}
			};

			Validator.prototype.set = function(attribute, value) {
				if ((attribute.validation instanceof Function && !attribute.validation(value)) || (attribute.type && toString.call(attribute.value) !== '[object ' + attribute.type + ']')) {
					EventPublisher.publish({
						eventName: 'ModelFactory.set.error.invalidValue',
						data: {
							attribute: attribute,
							value: value
						}
					});
					return false;
					// throw new Error("Invalid data. Expecting " + attribute.type);
				} else {
					return true;
				}
			};

			/**
			 * Initialize the model
			 * @param {[type]} options [description]
			 */
			var Model = function(options) {
				this.type = options.type;
				this.validator = new Validator(this);
			};

			/**
			 * Get the value of a property
			 * @param  {String} attribute The attribute to get
			 * @return {} The value of the attribute
			 */
			Model.prototype.get = function(attribute) {
				return Private.attributes[attribute] && Private.attributes[attribute].value || undefined;
			};

			/**
			 * Sets the value of an attribute
			 * @param {String} attribute The attribute name
			 * @param {} value The attribute value to set
			 */
			Model.prototype.set = function(attribute, value) {
				if (this.validator.set(Private.attributes[attribute], value)) {
					Private.attributes[attribute].previous = Private.attributes[attribute].value;
					Private.attributes[attribute].value = value;
				}
			};

			Model.prototype.has = function(attribute) {
				return Private.attributes.hasOwnProperty(attribute);
			};

			/**
			 * Initialize
			 */
			var model;
			if (Validator.prototype.options(options)) {
				model = new Model(options);
				Private.setupAttributes();
			}

			return model;

		};
	}
};