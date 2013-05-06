var EventPublisher = (function() {

	"use strict";

	/*return {
		publish: function() {
			console.log("in");
		}
	};*/

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
			// this needs to check for listeners based on env
			return true;
		},
		publish: function(eventName, data) {
			// this needs to publish event based on env
		}
	};

	var Private = {
		/**
		 * Default configuration
		 * @type {Object}
		 */
		config: {
			env: undefined,
			statuses: []
		},
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
							// if all the groups events have sent data
							if (_.unique(_.values(this.published))[0] === true) {
								// broadcast it
								Public.broadcast(this.title + '.success', this.data);
								// remove the group
								Private.group.remove(this.title);
							}
						} else {
							// broadcast it
							Public.broadcast(this.title + '.error', this.data);
							// remove the group
							Private.group.remove(this.title);
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
		broadcast: {
			event: function(eventName, data, info) {
				// if ($rootScope.$$listeners[eventName]) {
				if (Listeners.exist(eventName)) {
					Private.log(eventName, data, info);
					Listeners.publish(eventName, data);
					// $rootScope.$broadcast(eventName, data);
				} else if (eventName.match(/\./g) && eventName.match(/\./g).length > 1 && !eventName.match(/undefined/g)) {
					// we log uncaught full events, in case no error handlers exist
					Private.log(eventName, data, 'Not broadcasted');
				}
			},
			status: function(Event, data) {
				if (Private.config.statuses.indexOf(Event.status) !== -1 && !$rootScope.$$listeners[Event.type]) {
					Private.log(Event.status, data, Event.statusInfo);
					$rootScope.$broadcast(Event.status, data, Event.statusInfo);
				}
			}
		}
	};

	var Public = {
		config: function(config) {
			Private.config = config;
		},
		/**
		 * Publishes an event
		 * @param  {Object} options The options object might have the following attributes
		 * 
		 * @param  {String} eventName The event to publish. Must be in this format: Object.action.status.statusInfo
		 * @param  {} data The data to send with the event
		 * @return {} info Additional info for logging purposes
		 */
		publish: function(options) {

			var Event = Private.createEvent(options.eventName);

			// check for groups
			for (var i = 0, length = Private.groups.length; i < length; i++) {
				Private.groups[i].publish(Event, options.data);
			}

			if (Private.suppressedEvents.indexOf(Event.object + '.' + Event.action) === -1) {

				Private.broadcast.event(Event.object, options.data);
				Private.broadcast.event(Event.object + '.' + Event.action, options.data);
				Private.broadcast.event(Event.object + '.' + Event.action + '.' + Event.status, options.data);
				Private.broadcast.event(Event.object + '.' + Event.action + '.' + Event.status + '.' + Event.statusInfo, options.data);
				Private.broadcast.status(Event, options.data);
			} else {
				// remove it
				// Private.suppressedEvents = _.without(Private.suppressedEvents, Event.object + '.' + Event.action);
			}
		},
		group: function(events, groupTitle, suppress, timeout) {
			Private.groups.push(Private.group.create(events, groupTitle, suppress));
			// remove th group after a timeout, we dont want unpublished events to permanently add groups
			timeout = timeout || 5000;
			$timeout(function() {
				Private.group.remove(groupTitle);
			}, timeout);
		}
	};

	return Public;

}());