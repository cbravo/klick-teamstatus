var KlickTeamStatus =  (function(app){

	//app.genome = app.genome || {};

	app = $.extend(app,{
		config : {
			'loader' : '#loader',
			'genomeUrl' : '//genome.klick.com:80',
			'currentView' : '#options-view'
		},
		init : function() {
			app.helpers.toggleView(app.config.currentView, app.config.currentView + '-toggle');
			app.genome.init();	
		},
		displayUsers : function (users) {

			var userListHtml = '<div class="row">\n';
			var $target = $('#user-list');
			var counter = 0;

			$.each(users, function() { 

				if(counter % 6 == 0){
					userListHtml += '<div class="clearfix visible-lg"></div>\n';
				}
				if(counter % 4 == 0){
					userListHtml += '<div class="clearfix visible-md"></div>\n';
				}
				if(counter % 3 == 0){
					userListHtml += '<div class="clearfix visible-sm"></div>\n';
				}
				if(counter % 2 == 0){
					userListHtml += '<div class="clearfix visible-xs"></div>\n';
				}

				var userClass = (this.KeyscanStatus == 'NOTIN' || this.KeyscanStatus.indexOf("OUT") > -1 )? ' disabled' : '' ;
				var keyscanStatus = (this.KeyscanStatus != 'NOTIN' )? app.helpers.parseKeyScanStatus(this.KeyscanStatus) : 'NOT IN'
				userListHtml += '<div class="col-xs-6 col-sm-4 col-md-3 col-lg-2 clearfix">\n';
					userListHtml += '<div class="user'+userClass+'">\n';
						userListHtml += '<div class="photo"><img width="100%"  src="'+app.config.genomeUrl+this.PhotoPath +'" alt="'+ this.FirstName + ' ' + this.LastName +'" /></div>\n';
						userListHtml += '<ul>\n';
							userListHtml += '<li class="status"><strong>'+ keyscanStatus +'</strong></li>\n';
							userListHtml += '<li class="name"><strong>'+this.FirstName +' '+ this.LastName+'</strong> ';
							if (this.KeyscanStatus != 'NOTIN'){
								var keyScanTime = new Date(parseInt(/\d+/.exec(this.KeyscanUpdated)[0]));
								var timeSince = app.helpers.getTimeSince(keyScanTime);
								userListHtml += '<span>Updated '+ timeSince +' ago</span></li>\n';
							}
							// userListHtml += '<li>'+ this.Title +'</li>\n';
						userListHtml += '</ul>\n';
					userListHtml += '</div>\n';
				userListHtml += '</div>\n';
				counter++;
			});

			userListHtml += '</div>\n';

			if(counter == 1){
				userListHtml = 'No users are currently free.';
			}
			$target.html(userListHtml);
		},
		saveUsers : function(){
			userList = $('#teamlist').val();
			app.helpers.setData('userlist', userList); 
			console.log(app.genome.getStoredUserList('userlist'));
		}
	});
	
	app.genome = $.extend(app.genome,{
		init : function(){
			app.genome.loggedIn = false;
			app.genome.currentUser = {};
			app.genome.getUserTeam();
		},
		// getCurrentUser : function(){
		// 	//make ajax call to genome
		// 	app.helpers.startAjaxLoad();
		// 	var call = app.helpers.requestJSON(app.config.genomeUrl+'/api/User/Current.json');
		// 	call.error(function(data){
		// 		app.helpers.createAlert('#global-alerts', 'error', '<strong>Failed to make contact with Genome.</strong> Log into Genome before using Klick Idle!');
		// 		$('.main-content').hide();
		// 	})
		// 	call.success(function(data){
		// 		app.genome.loggedIn = true;
		// 		app.genome.handleCurrentUserData(data);
		// 		app.helpers.endAjaxLoad();
		// 	});
		// },
		// handleCurrentUserData : function (data){
		// 	app.genome.currentUser = data.Entries[0];
		// 	var user = app.genome.currentUser;

		// 	//seems like sometimes the value for phone extention is stored under a different name.
		// 	if(user.PhoneExt == null){
		// 		user.PhoneExt = app.genome.currentUser.Extension;
		// 	};
		// 	app.helpers.createAlert('#global-alerts', 'success', '<strong>Welcome to Klick Team Status:</strong> a tool you can use to see the current status of any given team! Use the navigation at the top of the page to set the team or view the team status.', 15000);
		// 	app.genome.getUserTeam(user);
		// },
		getStoredUserList : function(){
			var userlist = app.helpers.getData('userlist');
			return userlist;
		},
		getUserTeam : function(user){
			var call = app.helpers.requestJSON(app.config.genomeUrl+'/api/User.json?SupervisorID=4347');
			call.error(function(data){
				app.helpers.createAlert('#global-alerts', 'error', '<strong>Failed to make contact with Genome.</strong> Log into Genome before using Klick Idle!');
			})
			call.success(function(data){
				app.displayUsers(data.Entries);
			})
		}
	})

	app.helpers = $.extend(app.helpers,{
		scrollTo : function(target) {
			var scrollElement = 'html, body';
			var $target = $(target);
			var offset = 30; //amount to offset for a nice scroll

			$(scrollElement).stop().animate({
				'scrollTop': $target.offset().top - offset
			}, 500, 'swing', function() {
				//this doesnt seem supported in ie8
				// history.pushState(null, null, target); 
			});
		},
		requestJSON : function(url)  {
			var ajaxCall = $.ajax({
				url: url,
				contentType: "application/json",
				dataType: 'jsonp'
			});
			return ajaxCall;
		},
		getTimeSince : function (date) {

			var seconds = Math.floor((new Date() - date) / 1000);
			var interval = Math.floor(seconds / 31536000);

			if (interval > 1) {
				return interval + " years";
			}
			interval = Math.floor(seconds / 2592000);
			if (interval > 1) {
				return interval + " months";
			}
			interval = Math.floor(seconds / 86400);
			if (interval > 1) {
				return interval + " days";
			}
			interval = Math.floor(seconds / 3600);
			if (interval > 1) {
				return interval + " hours";
			}
			interval = Math.floor(seconds / 60);
			if (interval > 1) {
				return interval + " minutes";
			}
			return Math.floor(seconds) + " seconds";
		},
		startAjaxLoad : function(){
			$(app.config.loader).show();
		},
		endAjaxLoad : function (){
			$(app.config.loader).fadeOut();
		},
		createAlert : function (target, type, alerttext, duration){
			var alertclass = '';
			var alerthtml = '';
			var $target = $(target);

			if(type == 'error'){
				alertclass = 'alert-danger';
			}
			else if(type == 'success'){
				alertclass = 'alert-success';
			}
			
			alerthtml = '<div role="alert" class="alert '+ alertclass +'">'+alerttext+'</div>';
			$target.find('.alert-container').html(alerthtml)

			$target
				.css('opacity', 0)
				.slideDown('slow')
				.animate(
				{ opacity: 1 },
				{ queue: false, duration: 'slow', complete: function(){

					if(duration != null){
						setTimeout(function(){
							$target
							.slideUp('slow')
							.animate(
							  { opacity: 0 },
							  { queue: false, duration: 'slow' }
							);
						}, duration);
					}
				}
			});
		},
		toggleView : function(viewId, trigger){
			var $trigger = $(trigger);
			$trigger.parent().siblings().find('a').removeClass('selected');
			$trigger.addClass('selected');

			var $currentView = $(app.config.currentView);
			var $newView = $(viewId);

			$currentView.fadeOut('fast', function(){
				$newView.fadeIn();
				app.config.currentView = viewId;
			});
		},
		parseKeyScanStatus : function(status){
			var parsedStatus = '';
			if(status.indexOf("OUT") > -1){
				 parsedStatus = 'NOT IN';
			}
			else{
				var currentFloor = status.substring(2, status.length);
				parsedStatus = 'IN - ' + app.helpers.getGetOrdinal(currentFloor) +' floor';
			}
			return parsedStatus;
		},
		getGetOrdinal : function(n) {
		   var s=["th","st","nd","rd"],
		       v=n%100;
		   return n+(s[(v-20)%10]||s[v]||s[0]);
		},
		setData : function(key,value){
			if(typeof(Storage) !== "undefined") {
				localStorage.setItem(key, value);
			} else {
			   app.helpers.createAlert('#global-alerts', 'error', '<strong>Failed to store data to local storage.</strong> Please use a modern browser that supports local storage.');
			}
		},
		getData : function(key){
			if(typeof(Storage) !== "undefined") {
				var storedData = localStorage.getItem(key);
				return storedData;
			} else {
			   app.helpers.createAlert('#global-alerts', 'error', '<strong>Failed to get data from local storage.</strong> Please use a modern browser that supports local storage.');
			}
		}
	})

	return app;
}(KlickTeamStatus || {} ));
