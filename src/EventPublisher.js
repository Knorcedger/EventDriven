var EventPublisher = (function() {

	"use strict";

	var Pubsub = function() {
		this.subscribers = {};
	};

	Pubsub.prototype.on = function(eventName, fn) {
		if (!_.isArray(this.subscribers[eventName])) {
			this.subscribers[eventName] = [];
		}
		this.subscribers[eventName].push(fn);
	};

	Pubsub.prototype.publish = function(event) {
		var eventName = event.object + '.' + event.action;
		for (var i = 0, length = this.subscribers[eventName] && this.subscribers[eventName].length || 0; i < length; i++) {
			this.subscribers[eventName][i].apply(this, arguments);
		}
	};

	var Listeners = {
		exist: function(eventName) {
			/*if (Private.config.env === 'angular') {
				if ($rootScope.$$listeners[eventName]) {
					return true;
				}
			}
			return false;*/
			return true;
		},
		publish: function(eventName, data) {
			if (Private.config.env === 'angular') {
				$rootScope.$broadcast(eventName, data);
			} else if (Private.config.env === 'jquery') {
				$(document).trigger(eventName, data);
			}
		}
	};

	var Private = {
		/**
		 * Default configuration
		 * @type {Object}
		 */
		config: {},
		suppressedEvents: [],
		groups: [],
		group: {
			create: function(events, groupTitle, suppress) {
				var pubsub = new Pubsub();
				pubsub.title = groupTitle;
				pubsub.suppress = suppress;
				pubsub.published = {};
				pubsub.data = {};

				for (var i = 0, length = events.length; i < length; i++) {
					pubsub.published[events[i]] = false;
					// add events as suppressed
					if (pubsub.suppress) {
						Private.suppressedEvents.push(events[i]);
					}
					// listener
					pubsub.on(events[i], function(event, data) {
						if (event.status === 'success') {
							var eventName = event.object + '.' + event.action;
							// mark as published
							this.published[eventName] = true;
							// save the data
							this.data[eventName] = data;
							// if all the groups events have been published
							var status = _.unique(_.values(this.published));
							if (status.length === 1 && status[0] === true) {
								// broadcast it
								Public.publish(this.title + '.success', this.data);
								// remove the group
								Private.group.remove(this.title);
							}
						} else {
							// remove the group
							Private.group.remove(this.title);
							// publish it
							Public.publish(this.title + '.error', this.data);
						}
					});
				}

				return pubsub;
			},
			remove: function(title) {
				Private.groups = _.reject(Private.groups, function(item) {
					return item.title === title;
				});
			}
		},
		createEvent: function(eventName) {
			var temp = eventName.split('.');
			var Event = {
				object: temp[0],
				action: temp[1],
				status: temp[2],
				statusInfo: temp[3],
				type: eventName
			};

			return Event;
		},
		log: function(eventName, data, info) {
			if (info) {
				console.log("Event:", eventName, "Data:", data, "Info:", info);
			} else {
				console.log("Event:", eventName, "Data:", data);
			}
		},
		publish: function(eventName, data, info) {
			if (Listeners.exist(eventName)) {
				Private.log(eventName, data, info);
				Listeners.publish(eventName, data);
			} else if (eventName.match(/\./g) && eventName.match(/\./g).length > 1 && !eventName.match(/undefined/g)) {
				// we log uncaught full events, in case no error handlers exist
				Private.log(eventName, data, 'Not broadcasted');
			}
		}
	};

	var Public = {
		config: function(config) {
			Private.config = config;
		},
		publish: function(options) {

			var Event = Private.createEvent(options.eventName);

			// check for groups
			for (var i = 0, length = Private.groups.length; i < length; i++) {
				Private.groups[i].publish(Event, options.data, options,info);
			}

			if (Private.suppressedEvents.indexOf(Event.object + '.' + Event.action) === -1) {

				Private.publish(Event.object, options.data);
				Private.publish(Event.object + '.' + Event.action, options.data);
				Private.publish(Event.object + '.' + Event.action + '.' + Event.status, options.data);
				Private.publish(Event.object + '.' + Event.action + '.' + Event.status + '.' + Event.statusInfo, options.data);
			} else {
				// remove it
				Private.suppressedEvents = _.without(Private.suppressedEvents, Event.object + '.' + Event.action);
			}
		},
		/**
		 * Groups events
		 * @param  {Array} events An array of the events to group
		 * @param  {String} groupTitle The event that will be fired when all grouped events are complete
		 * @param  {Boolean} suppress If you want to fire on not the grouped events
		 * @param  {Number} timeout The number in miliseconds in which the group will be deleted
		 */
		group: function(events, groupTitle, suppress, timeout) {
			Private.groups.push(Private.group.create(events, groupTitle, suppress));
			// remove the group after a timeout, we dont want unpublished events to permanently add groups
			timeout = timeout || 5000;
			$timeout(function() {
				Private.group.remove(groupTitle);
			}, timeout);
		}
	};

	return Public;

}());