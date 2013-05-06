var Collection = function(options) {

	// Array Remove - By John Resig (MIT Licensed)
	Array.prototype.clean = function(deleteValue) {
		for (var i = 0; i < this.length; i++) {
			if (this[i] == deleteValue) {
				this.splice(i, 1);
				i--;
			}
		}
		return this;
	};

	if (!options.type || !options.model) {
		throw new Error('Please provide both type and model');
	}

	var Private = {

	};

	this.type = options.type;
	this.model = options.model;
	this.models = [];
	/**
	 * Adds a model to the collection
	 * @param {Model} data The modelt o add
	 */
	this.add = function(data) {
		if (data && data.type === this.model) {
			this.models.push(data);
			EventPublisher.publish({
				eventName: this.type + '.add.success'
			});
		} else {
			EventPublisher.publish({
				eventName: this.type + '.add.error.invalidData'
			});
			throw Error('No data provided');
		}
	};
	this.remove = function(criteria) {
		if (criteria) {
			var positions = this.where(criteria, true);
			for (var i = 0, length = positions.length; i < length; i++) {
				delete this.models[positions[i]];
			}
			this.models.clean();
		} else {
			throw Error('Unspecified criteria. Maybe you want to use updateAll?');
		}
	};
	/**
	 * Adds an array of models to the collection, replaing the old models
	 * @param {Array} data An array of models
	 */
	this.set = function(data) {
		if (data) {
			for (var i = 0, length = data.length; i < length; i++) {
				if (!data || data[i].type !== this.model) {
					EventPublisher.publish({
						eventName: this.type + '.set.error.invalidData'
					});
				}
			}
			this.models = data;
			EventPublisher.publish({
				eventName: this.type + '.set.success'
			});
		} else {
			throw Error("No data provided");
		}
	};
	/**
	 * Gets all models
	 * @return {Array} An array with all the models
	 */
	this.get = function() {
		return this.models;
	};
	/**
	 * Updates all models matching the criteria
	 * @param  {Object} criteria  An object like {title: 'King'}
	 * @param  {Object} data The data to update e.g. {title: 'King', desc: 'test'}
	 */
	this.update = function(criteria, data) {
		if (criteria) {
			var modelsFound = this.where(criteria);
			for (var i = 0, length = modelsFound.length; i < length; i++) {
				for (var property in data) {
					modelsFound[i].set(property, data[property]);
				}
			}
		} else {
			throw Error('Unspecified criteria. Maybe you want to use updateAll?');
		}
	};
	this.replace = function(criteria, data) {
		if (criteria) {
			var modelsFound = this.where(criteria);
			for (var i = 0, length = modelsFound.length; i < length; i++) {
				for (var property in data.attributes) {
					modelsFound[i].set(property, data.get(property));
				}
			}
		} else {
			throw Error('Unspecified criteria. Maybe you want to use updateAll?');
		}
	},
	/**
	 * Find all models that satisy the given criteria
	 * @param  {Object} criteria An object like {title: 'King'}
	 * @params {Boolean} positions If set to true, it wont return the object but it's position in the collection
	 * @return {Array} An array with models
	 */
	this.where = function(criteria, positions) {
		var data = [];
		for (var i = 0, length = this.models.length; i < length; i++) {
			for (var key in criteria) {
				if (this.models[i].get(key) === criteria[key]) {
					if (positions) {
						data.push(i);
					} else {
						data.push(this.models[i]);
					}
				}
			}
		}
		return data;
	};
	/**
	 * Updates the specified attribute in all models
	 * @param  {Object} data The data to update e.g. {title: 'King', desc: 'test'}
	 */
	this.updateAll = function(data) {
		if (data) {
			for (var i = 0, length = this.models.length; i < length; i++) {
				for (var property in data) {
					this.models[i].set(property, data[property]);
				}
			}
		} else {
			throw new Error("Please define update data");
		}
	};
};