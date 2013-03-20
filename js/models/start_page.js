var StartPage;
(function() {
"use strict";

StartPage = function() {};

mapLevelModel.extendTo(StartPage, {
	model_name: 'start_page',
	page_name: 'start page',
	zero_map_level: true,
	showPlaylists: function(){
		su.search(':playlists');
	},
	init: function(opts){
		this._super(opts);
		this.su = opts.app;
		this.updateState('needs_search_from', true);
		this.updateState('nav_title', 'Seesu start page');

		

		this.setChild('pstuff', this.getSPI('users/me').initOnce());
		this.setChild('muco', this.getSPI('conductor').initOnce());


		this.closed_messages = suStore('closed-messages') || {};
		return this;
	},
	sub_pages_routes: {
		'catalog': function(name) {
			if (!name){
				return;
			}
			var full_name = 'catalog/' + name;
			if (this.sub_pages[full_name]){
				return this.sub_pages[full_name];
			} else {
				var instance = new ArtCard();
				instance.init_opts = [{
					app: this.app,
					map_parent: this,
					nav_opts: {
						url_part: '/' + full_name
					}
				}, {
					artist: name
				}];
				return (this.sub_pages[full_name] = instance);
			}
		},
		'tags': function(name) {
			if (!name){
				return;
			}
			var full_name = 'tags/' + name;
			if (this.sub_pages[full_name]){
				return this.sub_pages[full_name];
			} else {
				var instance = new TagPage();
				instance.init_opts = [{
					app: this.app,
					map_parent: this,
					nav_opts: {
						url_part: '/' + full_name
					}
				}, {
					tag_name: name
				}];
				return (this.sub_pages[full_name] = instance);
			}

		},
		'users': function(name) {
			if (!name){
				return;
			}
			var full_name = 'users/' + name;
			if (this.sub_pages[full_name]){
				return this.sub_pages[full_name];
			} else {
				if (name == 'me'){
					var instance = new UserCard();
					instance.init_opts = [{
						app: this.app,
						map_parent: this,
						nav_opts: {
							url_part: '/' + full_name
						}
					}, {for_current_user: true}];
					return (this.sub_pages[full_name] = instance);
				}
			}

		}
	},
	sub_pa: {
		'conductor': {
			title: 'Music Conductor',
			constr: MusicConductor
		}
	},
	subPager: function(path_string) {
		var parts = path_string.split('/');
		var first_part = parts[0];
		return this.sub_pages_routes[first_part] &&  this.sub_pages_routes[first_part].call(this, parts[1]);
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