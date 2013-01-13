var StartPage;
(function() {
"use strict";

StartPage = function() {};

mapLevelModel.extendTo(StartPage, {
	model_name: 'start_page',
	page_name: 'start page',
	showPlaylists: function(){
		su.search(':playlists');
	},
	init: function(su){
		this._super();
		this.su = su;
		this.updateState('needs-search-from', true);
		this.updateState('nav-title', 'Seesu start page');

		



		var personal_stuff = (new UserCard()).init({app: su, pmd: this}, {for_current_user: true});
		this.setChild('pstuff', personal_stuff);

		var muco = (new MusicConductor()).init({app: su, pmd: this});
		this.setChild('muco', muco);

		this.on('state-change.can-expand', function(e) {
			muco.updateState('can-expand', e.value);
			personal_stuff.updateState('can-expand', e.value);
		});


		this.closed_messages = suStore('closed-messages') || {};
		return this;
	},
	short_title: 'Seesu',
	getTitle: function() {
		return this.short_title;
	},
	messages: {
		"rating-help": function(state){
			if (su.app_pages[su.env.app_type]){
				if (state){
					this.updateState('ask-rating-help', su.app_pages[su.env.app_type]);
				} else {
					this.updateState('ask-rating-help', false);
				}
				
			}
		}
	},
	closeMessage: function(message_name) {
		if (this.messages[message_name] && !this.closed_messages[message_name]){
			this.closed_messages[message_name] = true;
			suStore('closed-messages', this.closed_messages, true);
			this.messages[message_name].call(this, false);
		}
	},
	showMessage: function(message_name) {
		if (this.messages[message_name] && !this.closed_messages[message_name]){
			this.messages[message_name].call(this, true);
		}
	}
});

})();