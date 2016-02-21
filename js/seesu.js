define(
['spv', 'app_serv', 'pv', 'jquery', './libs/navi', './libs/BrowseMap', './libs/Mp3Search',
'./libs/FuncsQueue', './LfmAuth',
'./models/AppModel', './models/comd', './models/StartPage', './libs/VkAuth', './libs/VkApi', './modules/initVk',
'./modules/PlayerSeesu', './models/invstg', 'cache_ajax', 'View', 'js/libs/localizer', './modules/route', './initAPIs'],
function(spv, app_serv, pv, $, navi, BrowseMap, Mp3Search,
FuncsQueue, LfmAuth ,
AppModel, comd, StartPage, VkAuth, VkApi, initVk,
PlayerSeesu, invstg, cache_ajax, View, localize_dict, route, initAPIs) {
'use strict';
var app_env = app_serv.app_env;

var resortSuQueue = function(su) {
	return function resortQueue(queue) {
		su.resortQueue(queue);
	};
};

$.ajaxSetup({
  cache: true,
  global:false,
  timeout:40000,
});
$.support.cors = true;

var pvUpdate = pv.update;
var chrome = window.chrome;
var ChromeExtensionButtonView = spv.inh(View, {}, {
	state_change: {
		"playing": function(target, state) {
			if (state){
				chrome.browserAction.setIcon({path:"/icons/icon19p.png"});
			} else {
				chrome.browserAction.setIcon({path:"/icons/icon19.png"});
			}
		},
		'now_playing_text': function(target, text) {
			chrome.browserAction.setTitle({title: text});
		}
	}
});
var OperaExtensionButtonView = spv.inh(View, {}, {
	state_change: {
		"playing": function(target, state) {
			if (state){
				target.opts.opera_ext_b.icon = "/icons/icon18p.png";
			} else {
				target.opts.opera_ext_b.icon = "/icons/icon18.png";
			}
		},
		'now_playing_text': function(target, text) {
			target.opts.opera_ext_b.title = text;
		}
	}
});


var SeesuApp = function() {};
AppModel.extendTo(SeesuApp, {
	'compx-app_lang': [['env.lang']],
	'compx-locales': [
		['app_lang'],
		function(app_lang) {
			var result = {};
			for (var string in localize_dict) {
				if (localize_dict[string]){
					result[string] = localize_dict[string][app_lang] || localize_dict[string].original;
				}
			}
			return result;
		}
	],
	'stch-session@lfm_auth': function(target, state) {
		if (state) {
			pvUpdate(target, 'lfm_userid', target.lfm.username);
		}
	},
	'chi-vk_users': pv.Model,
	'chi-vk_groups': pv.Model,
	'chi-art_images': comd.LastFMArtistImagesSelector,
	'chi-invstg': invstg.SearchPage,
	'chi-mp3_search': Mp3Search,
	'chi-vk_auth': VkAuth,
	'chi-lfm_auth': LfmAuth,
	tickStat: function(data_array) {
		window._gaq.push(data_array);
	},
	init: function(opts, version){
		this.app = this;
		this._super(opts);
		this.version = version;
		pvUpdate(this, 'env', this._highway.env.states);

		var resortQueue = resortSuQueue(this);


		this._url = app_serv.get_url_parameters(window.location.search, true);
		this.settings = {};
		this.settings_timers = {};

		var _this = this;
		this.trackStat = (function(){
			window._gaq = window._gaq || [];
			//var _gaq = window._gaq;
			window._gaq.sV = spv.debounce(function(v){
				app_serv.store('ga_store', v, true);
			},130);
			window._gaq.gV = function(){
				return app_serv.store('ga_store');
			};
			window._gaq.push(['_setAccount', 'UA-17915703-1']);
			window._gaq.push(['_setCustomVar', 1, 'environmental', (!app_env.unknown_app ? app_env.app_type : 'unknown_app'), 1]);
			window._gaq.push(['_setCustomVar', 2, 'version', version, 1]);
			spv.domReady(window.document, function(){
				app_serv.loadJS('js-sep/ga.mod.min.js', function(){
					console.log('ga done');
				});
			});
			return function(data_array){
				_this.nextTick(_this.tickStat, [data_array]);
			};
		})();

		var lu = app_serv.store('su-usage-last');

		this.last_usage = (lu && new Date(lu)) || ((new Date() * 1) - 1000*60*60*0.75);
		this.usage_counter = parseFloat(app_serv.store('su-usage-counter')) || 0;


		setInterval(function(){

			var now = new Date();

			if ((now - _this.last_usage)/ (1000 * 60 * 60) > 4){
				_this.checkStats();
				app_serv.store('su-usage-last', (_this.last_usage = new Date()).toUTCString(), true);
				app_serv.store('su-usage-counter', ++_this.usage_counter, true);
			}


		}, 1000 * 60 * 20);
		setInterval(function(){
			return;
			/*var rootvs = _this.mpx.getViews('root');
			if (rootvs && rootvs.length){
				_this.updateLVTime();
			}*/
		}, 1000 * 60 * 2);

		this.popular_artists = ["The Beatles", "Radiohead", "Muse", "Lady Gaga", "Eminem", "Coldplay", "Red Hot Chili Peppers", "Arcade Fire", "Metallica", "Katy Perry", "Linkin Park" ];
		this.mp3_search = this.initChi('mp3_search', false, {
			vk: 5,
			'pleer.com': 4,
			nigma: 1,
			exfm: 0,
			soundcloud: -5,
			lastfm:-10,
			torrents: -15
		});



		this.notf = new comd.GMessagesStore(
			this,
			function(value) {
				return app_serv.store('notification', value, true);
			},
			function() {
				return app_serv.store('notification');
			}
		);

		initAPIs(this, app_serv, app_env, cache_ajax, resortQueue);

		this.p = new PlayerSeesu(this);
		this.player = this.p;
		this.app_md = this;
		this.art_images = this.initChi('art_images');

		this.vk_users = this.initChi('vk_users');
		this.vk_groups = this.initChi('vk_groups');

		if (app_env.check_resize){
			pv.update(this, 'slice-for-height', true);
		}
		if (app_env.deep_sanbdox){
			pv.update(this, 'deep_sandbox', true);
		}

		this.start_page = new StartPage({app: this});

		this.initMapTree(this.start_page, app_env.needs_url_history, navi)
			/*
			.on('residents-tree', function() {

			}, this.getContextOptsI())
			.on('every-url-change', function(nv, ov, replace) {
				if (replace){
				}

			}, {immediately: true})*/
			.on('nav-change', function(nv){
				this.trackPage(nv.md.model_name);
			}, this.getContextOptsI());


		if (app_env.tizen_app){
			//https://developer.tizen.org/
			spv.addEvent(window, 'tizenhwkey', function(e) {
				if(e.keyName == "back"){
					//tizen.application.getCurrentApplication().exit();
					var history = window.history;
					if (!history.state){
						var app = window.tizen.application.getCurrentApplication();
						app.exit();
					} else {
						history.back();
					}

				}
			});
		}

		var addBrowserView = function(Constr, name, opts) {
			var mpx = _this.connectMPX();

			var view = new Constr({
				mpx: mpx
			}, opts);

			mpx.addView(view, name);
			view.requestView();
		};

		//var ext_view;
		if (app_env.chrome_like_ext){
			addBrowserView(ChromeExtensionButtonView, 'chrome_ext');
		} else if (app_env.opera_extension && window.opera_extension_button){
			this.opera_ext_b = window.opera_extension_button;
			addBrowserView(OperaExtensionButtonView, 'opera_ext', {opera_ext_b: window.opera_extension_button});
		}

		setTimeout(function(){
			_this.checkStats();
		},100);


		setTimeout(function() {
			for (var i = _this.supported_settings.length - 1; i >= 0; i--) {
				var cur = _this.supported_settings[i];
				var value = app_serv.store('settings.' + cur);
				if (value){
					try {
						value = JSON.parse(value);
					} catch(e){}
				}
				if (typeof value == 'string'){
					if (value == 'true'){
						value = true;
					} else if (value == 'false'){
						value = false;
					}
				}


				_this.letAppKnowSetting(cur, value);
			}
			var last_ver = app_serv.store('last-su-ver');
			_this.migrateStorage(last_ver);
			app_serv.store('last-su-ver', version, true);

		}, 200);





		_this.map.makeMainLevel();

		if (app_env.needs_url_history){
			// _this.map.makeMainLevel();
			navi.init(function(e){
				var url = e.newURL;
				_this.map.startChangesCollecting({
					skip_url_change: true
				});

				var state_from_history = navi.findHistory(e.newURL);
				if (state_from_history){
					state_from_history.data.showOnMap();
				} else{
					var interest = BrowseMap.getUserInterest(url.replace(/\ ?\$...$/, ''), _this.start_page);
					BrowseMap.showInterest(_this.map, interest);
				}
				_this.map.finishChangesCollecting();
			});
			(function() {
				var url = window.location && window.location.hash.replace(/^\#/,'');
				if (url){
					_this.on('handle-location', function() {
						navi.hashchangeHandler({
							newURL: url
						}, true);

					});
				} else {
					BrowseMap.showInterest(_this.map, []);
				}
			})();
		} else {
			BrowseMap.showInterest(_this.map, []);
		}

		if (app_serv.app_env.nodewebkit) {
			pv.update(this, 'disallow_seesu_listeners', true);
		}
		this.on('child_change-current_mp_md', function() {
			this.closeNavHelper();
		});
	},
	watchVKCharacter: function(md, key, result_state) {
		var store, character_id;

		if (key > 0) {
			store = this.vk_users;
			character_id = key;
		} else {
			store = this.vk_groups;
			character_id = key * -1;
		}

		md.wch(store, character_id, result_state);

	},
	migrateStorage: function(ver){
		if (!ver){
			var lfm_scrobbling_enabled = app_serv.store('lfm_scrobbling_enabled');
			if (lfm_scrobbling_enabled){

				app_serv.store('lfm_scrobbling_enabled', '', true);
				this.setSetting('lfm-scrobbling', lfm_scrobbling_enabled);
			}
		}
		if (typeof this.settings['volume'] == 'number'){
			this.setSetting('volume', [this.settings['volume'], 100]);
		}
	},

	checkStats: function() {
		if (this.usage_counter > 2){
			this.start_page.showMessage('rating-help');
		}
		return this;
	},
	supported_settings: ['lfm-scrobbling', 'dont-rept-pl', 'rept-song', 'volume', 'files_sources', 'pl-shuffle'],
	letAppKnowSetting: function(name, value){
		this.settings[name] = value;
		pv.update(this, 'settings-' + name, value);
		//this.trigger('settings-' + name, value);
	},
	storeSetting: function(name, value){
		clearTimeout(this.settings_timers[name]);

		this.settings_timers[name] = setTimeout(function(){
			app_serv.store('settings.'+ name, value, true);
		}, 333);

	},
	setSetting: function(name, value){
		if (this.supported_settings.indexOf(name) != -1){
			this.letAppKnowSetting(name, value);
			this.storeSetting(name, value);
		} else{

		}


	},
	showPlaylists: function() {
		this.search(':playlists');
	},
	fs: {},//fast search
	env: app_env,
	server_url: 'http://seesu.me/',
	encodeURLPart: route.encodeURLPart,
	decodeURLPart: route.decodeURLPart,
	joinCommaParts: route.joinCommaParts,
	getCommaParts: route.getCommaParts,
	app_pages: {
		chrome_extension: "https://chrome.google.com/webstore/detail/nhonlochieibnkmfpombklkgjpkeckhi/reviews",
		chrome_app: "https://chrome.google.com/webstore/detail/fagoonkbbneajjbhdlklhdammdfkjfko/reviews",
		opera_widget: "http://widgets.opera.com/widget/15872/",
		opera_extension: "https://addons.opera.com/addons/extensions/details/seesu-music",
		pokki_app: "https://www.pokki.com/app/Seesu"
	},

	trackEvent:function(){
		var current_page = this.current_page || '(nonono)';
		var args = Array.prototype.slice.call(arguments);
	//	args.unshift('_trackEvent');

		this.trackStat.call(this, function() {
			var pageTracker = window._gat._getTrackerByName(current_page);
			pageTracker._trackEvent.apply(pageTracker, args);
		});
	},
	'rootv_field': ['mpx', 'views_index', 'root', 'length'],
	trackPage:function(page_name){
		this.current_page = page_name;

		var args = Array.prototype.slice.call(arguments);
		args.unshift('_trackPageview');

		if (!this.app_view_id){
			this.last_page_tracking_data = args;
			return;
		} else {
			this.trackStat.call(this, args);
		}

	},
	checkPageTracking: function() {
		if (this.app_view_id && this.last_page_tracking_data){
			this.trackStat.call(this, this.last_page_tracking_data);
			this.last_page_tracking_data = null;

		}
	},
	trackTime: function(){
		var args = Array.prototype.slice.call(arguments);
		var current_page = this.current_page || '(nonono)';
		this.trackStat.call(this, function() {
			var pageTracker = window._gat._getTrackerByName(current_page);
			pageTracker._trackTiming.apply(pageTracker, args);
		});
	},
	trackVar: function(){
		var args = Array.prototype.slice.call(arguments);
		args.unshift('_setCustomVar');
		this.trackStat.call(this, args);
	},
	setVkApi: function(vkapi, user_id) {
		this.vk_api = vkapi;
		this.vktapi = vkapi;
		this.trigger('vk-api', vkapi, user_id);
	},
	createSearchPage: function() {
		// var sp = new invstg.SearchPage();
		// sp.init({
		// 	app: this,
		// 	map_parent: this.start_page
		// });
		return this.start_page.initChi('invstg');
	},

	getPlaylists: function(query) {
		var r = [],i;
		if (this.gena){
			for (i=0; i < this.gena.playlists.length; i++) {
				var cur = this.gena.playlists[i];
				if (query){
					if (cur.state('nav_title') == query){
						r.unshift(cur);

					} else if (cur.state('nav_title') && cur.state('nav_title').match(spv.getStringPattern(query))){
						r.push(cur);
					}
				} else {
					r.push(cur);
				}

			}
		}
		return r;
	},
	attachUI: function(app_view_id) {
		this.app_view_id = app_view_id;
		this.checkPageTracking();
	},
	detachUI: function(app_view_id) {
		if (this.p && this.p.c_song){
			this.showNowPlaying(true);
		}
		if (this.app_view_id === app_view_id){
			this.app_view_id = null;
		}
	},
	vkappid: 2271620,
	getAuthAndTransferVKInfo: function(vk_api, user_id) {
		if (!user_id){
			throw new Error('want to get photo but have not user id :(');
		}
		var _this = this;

		vk_api.get('getProfiles', {
			uids: user_id,
			fields: 'uid, first_name, last_name, domain, sex, city, country, timezone, photo, photo_medium, photo_big'

		},{nocache: true})
			.done(function(info) {
				info = info.response && info.response[0];
				if (info){
					_this.s.vk_id = user_id;

					var _d = spv.cloneObj({data_source: 'vkontakte'}, info);


					_this.s.setInfo('vk', _d);
					pvUpdate(_this, 'current_su_user_info', _d);

					if (!_this.s.loggedIn()){
						_this.s.getAuth(user_id, function() {
							_this.s.api('user.update', _d);
						});
					} else{
						_this.s.api('user.update', _d);
					}
				} else {

				}
			})
			.fail(function() {

			});
	},
	getPhotoFromVK: function() {
		this.getAuthAndTransferVKInfo(this.vk_api, this.s.vk_id);
	},
	getVKFriends: function(){
		var _this = this;
		if (!this.vk_api){
			return;
		}
		if (!this.vk_fr_req){
			this.vk_fr_req = this.vk_api.get("friends.get", {fields: "uid, photo"}, {cache_timeout: 1000*60*5})
				.done(function(){
					delete _this.vk_fr_req;
				});
		}
		this.vk_fr_req
			.done(function(r){
				_this.trigger("vk-friends", r && r.response.items);
			})
			.fail(function(){

			});

	},
	updateLVTime: function() {
		this.last_view_time = new Date() * 1;
	},
	vkSessCode: function(vk_t_raw) {
		if (vk_t_raw){
			var vk_token = new VkAuth.VkTokenAuth(this.vkappid, vk_t_raw);
			this.vk_auth.api = this.connectVKApi(vk_token, true);
			pvUpdate(this.vk_auth, 'has_token', true);
			this.vk_auth.trigger('full-ready', true);
		}
	},
	connectVKApi: function(vk_token, access, not_save) {
		var _this = this;


		var lostAuth = function(vkapi) {

			_this.mp3_search.remove(vkapi.asearch);
			vkapi.asearch.dead = vkapi.asearch.disabled = true;
			if (_this.vk_api == vkapi){
				_this.vk_api = null;
				_this.vktapi = _this.vk_open_api;
				_this.trigger('vk-api', null);
			}

		};
		var vkapi = new VkApi(vk_token, {
			queue: _this.vk_queue,
			jsonp: !app_env.cross_domain_allowed,
			cache_ajax: cache_ajax,
			onAuthLost: function() {
				lostAuth(vkapi);
				initVk.checkDeadSavedToken(vk_token);
			},
			mp3_search: _this.mp3_search
		});

		_this.setVkApi(vkapi, vk_token.user_id);
		if (access){
			_this.mp3_search.add(vkapi.asearch, true);
		}

		if (vk_token.expires_in){
			setTimeout(function() {
				lostAuth(vkapi);
			}, vk_token.expires_in);
		}
		if (!not_save){
			app_serv.store('vk_token_info', spv.cloneObj({}, vk_token, false, ['access_token', 'expires_in', 'user_id']), true);
		}
		return vkapi;
	},
	createLFMFile: function(artist, track_name, link) {
		return {
			link: link,
			artist: artist,
			track: track_name,
			from:'lastfm',
			media_type: 'mp3',
		};
	},
	checkUpdates: function(){
		var _this = this;

		$.ajax({
			url: this.s.url + 'update',
			global: false,
			type: "POST",
			dataType: "json",
			data: {
				ver: this.version,
				app_type: app_env.app_type
			}
		}).done(function(r){
			if (!r){return;}


			var cver = r.latest_version.number;
			if (cver > _this.version) {
				var message =
					'Suddenly, Seesu ' + cver + ' has come. ' +
					'You have version ' + _this.version + '. ';
				var link = r.latest_version.link;
				if (link.indexOf('http') != -1) {
					$('#promo').append('<a id="update-star" href="' + link + '" title="' + message + '"><img src="/i/update_star.png" alt="update start"/></a>');
				}
			}

			console.log('lv: ' +  cver + ' reg link: ' + (_this.vkReferer = r.vk_referer));

		});
	},
	nsd_handlers: {
		su_users: function(list) {
			var app = this;

			for (var i = 0; i < list.length; i++) {
				var id = list[i].user;
				var md = app.routePathByModels('users/su:' + id);
				md.updateManyStates(list[i]);
			}
		},
		vk_groups: function(list) {
			var store = this.vk_groups;
			for (var i = 0; i < list.length; i++) {
				pv.update(store, list[i].id, list[i]);
			}
		},
		vk_users: function(list) {
			var store = this.vk_users;
			for (var i = 0; i < list.length; i++) {
				pv.update(store, list[i].id, list[i]);
			}
		},
		files: function(list, source_name, md) {

			var second_msq = md && md.model_name == 'song' && {
				artist: md.state('artist'),
				track: md.state('track')
			};

			for (var i = 0; i < list.length; i++) {
				var cur = list[i];
				if (!cur.link) {
					continue;

				}
				if (!cur.from) {
					cur.from = source_name;
				}

				if (!cur.media_type) {
					cur.media_type = 'mp3';
				}

				this.mp3_search.addFileToInvestg(cur, cur);
				if (second_msq) {
					this.mp3_search.addFileToInvestg(cur, second_msq);
				}
			}



		}
	},
	handleNetworkSideData: function(source_name, ns, data, md) {
		if (this.nsd_handlers[ns]) {
			this.nsd_handlers[ns].call(this, data, source_name, md);
		} else {
			console.log(source_name, ns, data);
		}

	},
	suggestNavHelper: function() {
		this.showNowPlaying();
		if (this.state('played_playlists_length') > 1) {
			pv.update(this, 'nav_helper_is_needed', true);
		}


	},
	closeNavHelper: function() {
		pv.update(this, 'nav_helper_is_needed', false);
	}

});

return SeesuApp;
});
