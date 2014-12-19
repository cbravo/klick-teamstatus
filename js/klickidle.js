var KlickTeamStatus =  (function(app){

	app.firebase = app.firebase || {};
	app.genome = app.genome || {};

	//configuration default settings
	app.config = {
		'loader' : '#loader',
		'firebaseUrl' : 'https://klickidle.firebaseio.com/',
		'genomeUrl' : '//genome.klick.com:80',
		'currentView' : '#team-view'
	};

	//initialize the app
	app.init = function() {
		app.toggleView(app.config.currentView, app.config.currentView + '-toggle');
		initGenome();
		initFirebase();
		app.genome.getCurrentUser();
	}

	//establish connection with Genome
	function initGenome(){
		//set up genome variables from config;
		app.genome.url = app.config.genomeUrl;
		app.genome.url.loggedIn = false;
		app.genome.currentUser = {};

		//get current user from genome
		app.genome.getCurrentUser = function(){
			//make ajax call to genome
			startAjaxLoad();
			var call = requestJSON(app.genome.url+'/api/User/Current.json');
			call.error(function(data){
				createAlert('#global-alerts', 'error', '<strong>Failed to make contact with Genome.</strong> Log into Genome before using Klick Idle!');
				$('.main-content').hide();
			})
			call.success(function(data){
				app.genome.url.loggedIn = true;
				app.firebase.getIdleUsers();
				checkIfUserExistsInFirebase(data);
			});

			//check if current user exists in firebase and if they are add data from firebase
			function checkIfUserExistsInFirebase(data){
				app.genome.currentUser = data.Entries[0];
				var user = app.genome.currentUser;

				//GA stuff
				var fullname = user.FirstName + ' ' + user.LastName;
				var userID = user.UserID;
				ga('send', 'pageview', {
					'dimension1':  fullname,
					'dimension2': userID
				});		

				//seems like sometimes the value for phone extention is stored under a different name.
				if(user.PhoneExt == null){
					user.PhoneExt = app.genome.currentUser.Extension;
				};
				

				app.firebase.users.child(user.UserID).once('value', function(snapshot) {
					if (snapshot.val() !== null){
						var firebaseData = snapshot.val();
						app.genome.currentUser.Status = user.Status = firebaseData.Status;
						app.genome.currentUser.Message = user.Message = firebaseData.Message;
						app.genome.currentUser.TimeStamp = user.TimeStamp = firebaseData.TimeStamp;
						app.genome.currentUser.LaborRole = user.LaborRole = firebaseData.LaborRole;
						populateCurrentUserData(user);
					}
					else{
						createAlert('#global-alerts', 'success', '<strong>Welcome to Klick Idle:</strong> a tool you can use to see who is currently available to help with some work! Use the navigation at the top of the page to set your own status or view idle Klicksters.', 15000);
						app.genome.currentUser.Status = user.Status = 'Not Set';
						app.genome.currentUser.Message = user.Message = '';
						getLaborRole(user);
					}
				});
			}
			
			function getLaborRole(user){
				var call = requestJSON(app.genome.url+'/api/LaborRole.json?LaborRoleID='+user.LaborRoleID);
				call.error(function(data){
					createAlert('#global-alerts', 'error', '<strong>Failed to make contact with Genome.</strong> Log into Genome before using Klick Idle!');
				})
				call.success(function(data){
					app.genome.currentUser.LaborRole = user.LaborRole = data.Entries[0].Name;
					populateCurrentUserData(user); 
				});
			}
			function populateCurrentUserData(user){


				var userDetailsText = '';
				userDetailsText += '<div class=" form-group clearfix">\n';
					userDetailsText += '<input type="hidden" name="UserID" value="'+ user.UserID +'" />\n';
					userDetailsText += '<input type="hidden" name="PhotoPath" value="'+ user.PhotoPath +'" />\n';
					userDetailsText += '<input type="hidden" name="FirstName" value="'+ user.FirstName  +'" />\n';
					userDetailsText += '<input type="hidden" name="LastName" value="'+ user.LastName  +'" />\n';
					userDetailsText += '<input type="hidden" name="Title" value="'+ user.Title +'" />\n';
					userDetailsText += '<input type="hidden" name="PhoneExt" value="'+ user.PhoneExt +'" />\n';
					userDetailsText += '<input type="hidden" name="Email" value="'+ user.Email +'" />\n';
					userDetailsText += '<input type="hidden" name="BusinessUnitName" value="'+ user.BusinessUnitName +'" />\n';
					userDetailsText += '<input type="hidden" name="LaborRole" value="'+ user.LaborRole +'" />\n';
					userDetailsText += '<div class="photo"><img src="'+app.genome.url+user.PhotoPath +'" alt="'+ user.FirstName + ' ' + user.LastName +'" /></div>\n';
					userDetailsText += '<ul>\n';
						userDetailsText += '<li class="name"><strong>'+ user.FirstName + ' ' + user.LastName +'</strong></li>\n';
						userDetailsText += '<li class="position"><strong>Title</strong>: '+ user.Title +'</li>\n';
						userDetailsText += '<li class="ext"><strong>Phone Ext:</strong> '+ user.PhoneExt +'</li>\n';
						userDetailsText += '<li class="email"><strong>Email:</strong> '+ user.Email +'</li>\n';
						userDetailsText += '<li class="labor-role"><strong>Department:</strong> '+ user.LaborRole +'</li>\n';
						userDetailsText += '<li class="unit"><strong>Team:</strong> '+ user.BusinessUnitName +'</li>\n';
					userDetailsText += '</ul>\n';
				userDetailsText += '</div>\n';
				userDetailsText += '<ul>\n';
					userDetailsText += '<li class="status"><strong>Status:</strong>\n';
						userDetailsText += '<select class="form-control" name="Status">\n';
							if(user.Status == 'Free'){
								userDetailsText += '<option selected="selected" value="Free">Free</option>\n';
								userDetailsText += '<option value="Busy">Busy</option>\n';
							}
							else if(user.Status == 'Busy'){
								userDetailsText += '<option value="Free">Free</option>\n';
								userDetailsText += '<option selected="selected" value="Busy">Busy</option>\n';
							}
							else{
								userDetailsText += '<option value="Free">Free</option>\n';
								userDetailsText += '<option value="Busy">Busy</option>\n';
							}
						userDetailsText += '</select>\n';
					userDetailsText += '</li>\n';
					userDetailsText += '<li class="idle-message"><strong>Idle Message:</strong><input class="form-control" type="text" name="Message" value="'+ user.Message +'" placeholder="leave a message..."/></li>\n';
				userDetailsText += '</ul>\n';

				var $target = $('#currentuser');
				var userStatus = 'Your current status: <strong>'+ user.Status +'</strong>';

				if(user.TimeStamp != null){
					var timeSince = getTimeSince(user.TimeStamp);
					userStatus += ' <span>updated '+ timeSince +' ago</span>';
				}
				else{
					userStatus += ' <span></span>';
				}

				$target.find('h2').html(userStatus);
				$target.find('.details-container').html(userDetailsText);
				
				endAjaxLoad();
				$target.fadeIn();
			}
		}     
	}


	//establish connection with Firebase
	function initFirebase(){
		//set up firebase variables from config;
		app.firebase.url = app.config.firebaseUrl;

		//establish firebase connection
		app.firebase.ref = new Firebase(app.firebase.url);
		app.firebase.users = app.firebase.ref.child("users");

		//grab user information from firebase;
		app.firebase.getIdleUsers = function(){
			app.firebase.users.on('value', function (snapshot) {
				if (snapshot.val() !== null){
					//chrome can't keep order of json obj intact when using numbers as keys. this is the workaround.
					var userData = [];
					snapshot.forEach(function(ss) {
					    userData.push(ss.val());
					});
					displayUsers(userData);
				}
				else{
					var $target = $('#user-list');
					$target.html('No users are currently free.');
				}
			}, function (errorObject) {
				createAlert('#global-alerts', 'error', 'Data could not be read.' + errorObject.code , 3000);
			});
		}

		function displayUsers(users){
			var userListHtml ='';
			var currentCategory = '';
			var $target = $('#user-list');
			$.each(users, function() { 
				if(this.Status == "Free"){
					var timeSince = getTimeSince(this.TimeStamp);

					if(this.LaborRole != currentCategory){
						userListHtml += '<h3>'+ this.LaborRole +'</h3>';
						currentCategory = this.LaborRole;
					}

					userListHtml += '<div class="user" onclick="KlickTeamStatus.firebase.getUserDetails('+ this.UserID +', this);">';
						userListHtml += '<div class="photo"><img width="50" height="75" src="'+app.genome.url+this.PhotoPath +'" alt="'+ this.FirstName + ' ' + this.LastName +'" /></div>\n';
						userListHtml += '<ul>\n';
							userListHtml += '<li class="name"><strong>'+this.FirstName +' '+ this.LastName+'</strong> <span>Updated '+ timeSince +' ago</span></li>\n';
							userListHtml += '<li>'+ this.Title +'</li>\n';
							userListHtml += '<li><strong>'+ this.Message +'</strong></li>\n';
						userListHtml += '</ul>\n';
					userListHtml += '</div>\n';
				}
			});
			if(userListHtml == ''){
				userListHtml = 'No users are currently free.';
			}
			$target.html(userListHtml);

		}

		app.firebase.getUserDetails = function(id, obj){
			$selectedUser = $(obj);
			$selectedUser.addClass('selected').siblings().removeClass('selected');
			app.firebase.users.child(id).once('value', function(snapshot) {
				if (snapshot.val() !== null){
					var userDetails = snapshot.val();
					populateUserData(userDetails);
				}
			});
			function populateUserData(user){
				var timeSince = getTimeSince(user.TimeStamp);
				var userDetailsText = '';
				userDetailsText += '<div>\n';
					userDetailsText += '<div class="photo"><img src="'+ app.genome.url+user.PhotoPath +'" alt="'+ user.FirstName + ' ' + user.LastName +'" /></div>\n';
					userDetailsText += '<ul>\n';
						userDetailsText += '<li class="name"><strong>'+ user.FirstName + ' ' + user.LastName +'</strong> <span>Updated '+ timeSince +' ago</span></li>\n';
						userDetailsText += '<li class="position"><strong>Title</strong>: '+ user.Title +'</li>\n';
						userDetailsText += '<li class="ext"><strong>Phone Ext:</strong> '+ user.PhoneExt +'</li>\n';
						userDetailsText += '<li class="email"><strong>Email:</strong> '+ user.Email +'</li>\n';
						userDetailsText += '<li class="labor-role"><strong>Department:</strong> '+ user.LaborRole +'</li>\n';
						userDetailsText += '<li class="unit"><strong>Team:</strong> '+ user.BusinessUnitName +'</li>\n';
					userDetailsText += '</ul>\n';
				userDetailsText += '</div>\n';
				userDetailsText += '<ul>\n';
					userDetailsText += '<li class="message"><strong>'+ user.Message +'</strong></li>\n';
				userDetailsText += '</ul>\n';


				var $target = $('#user');
				$target.find('.details-container').html(userDetailsText);
				$target.closest('.row').fadeIn('fast', function(){
					scrollTo('#user');
				});
			}
		}

		//update idle user or add them if they are not in the firebase
		app.firebase.updateUser = function(){
			//Prepate data from the form
			var $formfields = $('#currentuser').find('input,select');
			var userId = $('#currentuser').find('input[name=UserID]').val();                   
			var userData = {};
			$formfields.each(function(){
				var key = $(this).attr('name');
				var value = $(this).val();
				userData[key] = value;  
			});
			userData['TimeStamp'] = Date.now();

			//send user data to firebase
			app.firebase.users.child(userId).setWithPriority(userData, userData.LaborRole, function(error) {
				if (error) {
					createAlert('#status-alerts', 'error', 'Data could not be saved.' + error , 3000);
				} else {
					createAlert('#status-alerts', 'success', 'Status successfully updated!', 3000);
					updateUserDisplay();
				}
			});

			//if successful update the display
			function updateUserDisplay(){
				var $statusMessage =  $('#currentuser').find('h2');
				//reset time since update
				$statusMessage.find('span').fadeOut(function(){
					$(this).html('updated just now');
					$(this).fadeIn();
				});
				//if new status update the displayed status
				if(app.genome.currentUser.Status != userData.Status ){
					app.genome.currentUser.Status = userData.Status;
					$statusMessage.find('strong').fadeOut(function(){
						$(this).html(userData.Status);
						$(this).fadeIn();
					});
				}
			}


		}
	}

	function scrollTo(target){
		var scrollElement = 'html, body';
		var $target = $(target);
		var offset = 30; //amount to offset for a nice scroll

		$(scrollElement).stop().animate({
			'scrollTop': $target.offset().top - offset
		}, 500, 'swing', function() {
			//this doesnt seem supported in ie8
			// history.pushState(null, null, target); 
		});
	}
	//create jsonp request call 
	function requestJSON(url) {
		var ajaxCall = $.ajax({
			url: url,
			contentType: "application/json",
			dataType: 'jsonp'
		});
		return ajaxCall;
	}

	function getTimeSince(date) {

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
	}

	//show loader
	function startAjaxLoad(){
		$(app.config.loader).show();
	}
	//fade out loader
	function endAjaxLoad(){
		$(app.config.loader).fadeOut();
	}

	function createAlert(target, type, alerttext, duration){
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

	}

	app.toggleView = function(viewId, trigger){

		var $trigger = $(trigger);
		$trigger.parent().siblings().find('a').removeClass('selected');
		$trigger.addClass('selected');

		var $currentView = $(app.config.currentView);
		var $newView = $(viewId);

		$currentView.fadeOut('fast', function(){
			$newView.fadeIn();
			app.config.currentView = viewId;
		});

	}

	return app;
}(KlickTeamStatus || {} ));
