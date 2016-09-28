import { Template } from 'meteor/templating';
import './apis.html';

Template.apis.rendered = function () {
	if (!Session.get("animateChild")) {
		$(".dashboard-page").addClass("ng-enter");
		setTimeout(function () {
			$(".dashboard-page").addClass("ng-enter-active");
		}, 300);
		setTimeout(function () {
			$(".dashboard-page").removeClass("ng-enter");
			$(".dashboard-page").removeClass("ng-enter-active");
			Session.set("animateChild", true);
		}, 600);
	}
};

Template.apis.destroyed = function () {
	Session.set("animateChild", false);
};

if (Meteor.isClient) {
	Meteor.call('getAvailableAPIs', function (err, res) {
		Session.set('availableAPIs', res);
	})
}

Template.apis.helpers({
	availableAPIs() {
		return Session.get('availableAPIs');
    },
	selectedAPIPort() {
		let selectedAPIproject = Session.get('selectedAPI');

		if (!selectedAPIproject) return ''; //return meteor port if nothing selected
		let availableAPIs = Session.get('availableAPIs');
		let apiPort = '';

		availableAPIs.forEach(function (api) {
			if (api.project_name.trim().includes(selectedAPIproject.trim())) {
				apiPort = api.port.trim();
			}
		});
		return apiPort;
	}
})

Template.apis.events({
	'click .apiLink'(event) {
		if (event.target.text) {
			Session.set('selectedAPI', event.target.text);
		}
	}
})

Session.set("animateChild", false);