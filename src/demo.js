/*$(document).on('click', function(event) {

});*/

EventPublisher.config({
	env: "jquery",
	statuses: []
});

function des(value) {
	if (value === 4) {
		return true;
	} else {
		return false;
	}
}

var Task = new ModelFactory.extend({
	type: 'Task',
	schema: {
		title: {
			default: 'fire',
			validation: 'string'
		},
		description: {
			default: 'desc',
			validation: des
		}
	}
});

var Task2 = new ModelFactory.extend({
	type: 'Task2',
	schema: {
		title: {
			default: 'fire2',
			validation: 'string2'
		}
	}
});

task1 = new Task();
console.log(task1.get('title'));
task1.set('title', 'Do bath');
task1.set('description', 3);
console.log(task1.get('title'));

var task2 = new Task();
console.log(task2.get('title'));
task2.set('title', 'Go shopping');
console.log(task2.get('title'));