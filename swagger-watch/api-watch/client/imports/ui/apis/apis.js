import { Template } from 'meteor/templating';
import './apis.html';

	Template.apis.rendered = function(){
		if(!Session.get("animateChild")){
			$(".dashboard-page").addClass("ng-enter");
			setTimeout(function(){
				$(".dashboard-page").addClass("ng-enter-active");
			}, 300);
			setTimeout(function(){
				$(".dashboard-page").removeClass("ng-enter");
				$(".dashboard-page").removeClass("ng-enter-active");
				Session.set("animateChild", true);
			}, 600);
		}

	};

	Template.apis.destroyed= function(){
		Session.set("animateChild", false);
	};


Template.apis.helpers ({
	someHelper() {  return 456;  } ,
	
	availableAPIs () {
        console.log('yaaa');
        Meteor.call('getAvailableAPIs', function (err, res){

                console.log('client read res: ', res);

        })

    }

})

	Session.set("animateChild", false);