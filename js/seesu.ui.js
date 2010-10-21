window.seesu_ui = function(d, els, buttons){
	this.d = d;
	if (els){this.els = els;}
	if (buttons){this.buttons = buttons}
	seesu.ui.buttons_li = {};
	dstates.connect_ui(this);
}
seesu_ui.prototype = {
	show_artist: function (artist,with_search_results) {
		
		if (seesu.current_artist == artist && seesu.ui.playlist_type == 'artist') {
			seesu.ui.views.restore_view();
			return true;
		}
		seesu.ui.views.show_playlist_page(artist, 'artist', with_search_results);
		getTopTracks(artist,function(track_list){
			create_playlist(track_list);
		});
		lfm('artist.getInfo',{'artist': artist });
	
		
	},
	update_artist_info: function(artist, a_info, not_show_link_to_artist_page){
		var _sui = this;
		if (seesu.current_artist == artist) {
			if (seesu.ui.playlist_type == 'artist'){
				if (seesu.player.top_tracks_link){
					seesu.player.top_tracks_link.remove();
				}
			}
		} else {
			
			var ainf = {
				name: a_info.find('.artist-name').empty(), 
				image: a_info.find('img.artist-image'),
				bio: a_info.find('.artist-bio'),
				meta_info: a_info.find('.artist-meta-info'),
				c : a_info
			};
			
			
			var arts_name = $('<span class="desc-name"></span>')
				.appendTo(ainf.name);
				
			if (seesu.ui.playlist_type != 'artist'){
				seesu.player.top_tracks_link = $('<a class="js-serv">top tracks</a>')
					.data('artist', artist)
					.appendTo(arts_name)
					.click(function(){
						seesu.ui.show_artist(artist);
						seesu.track_event('Artist navigation', 'top tracks', artist);
					});
			}	
			
			$('<a></a>')
				.attr('href', 'http://www.last.fm/music/' + artist.replace(' ', '+'))
				.text('profile')
				.attr('title', 'last.fm profile')
				.click(function(){
					var link = 'http://www.last.fm/music/' + artist.replace(' ', '+');
					widget.openURL(link);
					seesu.track_event('Links', 'lastfm', link);
					return false;
				})
				.appendTo(arts_name);
			
			$('<span class="desc-text"></span>')
				.text(artist)
				.appendTo(ainf.name);
				
			ainf.image.attr('src', '').attr('alt', artist);
			ainf.bio.text('...');
			ainf.meta_info.empty();
			
			seesu.current_artist = artist;
			lfm('artist.getInfo',{'artist': artist }, function(r){
				_sui.show_artist_info(r, ainf, artist);
			});
		}
	},
	update_track_info: function(a_info, node){
		var ti = a_info.find('.track-info').empty();
		var mo = node.data('mo_pla');
		if (mo.from && mo.from == 'soundcloud'){
			if (mo.page_link){
				var sc_link = $('<a></a>')
					.attr('href', mo.page_link)
					.text('page of this track')
					.click(function(){
						widget.openURL(mo.page_link);
						seesu.track_event('Links', 'soundcloud track');
						return false;
					});
			}
			
			ti.append(
				$('<p></p>')
					.text(
						'This track was found in SoundCloud. ' + 
						'It may not match with track you are searching for at all. Try to use vk.com (vkontakte.ru) '
					 )
					 .append(sc_link)
				
			);
		}	
	},
	show_artist_info: function(r, ainf, oa){
		var _sui;
		var info	 = r.artist || false;
		var similars, artist, tags, bio, image;
		if (info) {
			similars = info.similar && info.similar.artist;
			artist	 = info.name;
			tags	 = info.tags && info.tags.tag;
			bio		 = info.bio && info.bio.summary.replace(new RegExp("ws.audioscrobbler.com",'g'),"www.last.fm");
			image	 = (info.image && info.image[2]['#text']) || lfm_image_artist;
		} 
			
		if (artist && artist == oa) {
			ainf.bio.parent().addClass('background-changes');
			ainf.image.attr({'src': image ,'alt': artist});
		} else{
			return false
		}
		if (bio){
			ainf.bio.html(bio);
		}
		
		
		
		
		
		if (tags && tags.length) {
			var tags_p = $("<p class='artist-tags'></p>").append('<span class="desc-name">Tags:</span>');
			var tags_text = $('<span class="desc-text"></span>').appendTo(tags_p);
			for (var i=0, l = tags.length; i < l; i++) {
				var tag = tags[i],
					arts_tag_node = $("<a></a>")
						.text(tag.name)
						.attr({ 
							href: tag.url,
							'class': 'music-tag js-serv'
						})
						.data('music_tag', tag.name)
						.appendTo(tags_text); //!using in DOM
			}
			ainf.meta_info.append(tags_p);
		}
		
		if (similars && similars.length) {
			var similars_p = $("<p></p>").attr({ 'class': 'artist-similar'}),
				similars_a = $('<a></a>').append('Similar artists').attr({ 'class': 'similar-artists js-serv'}).data('artist', artist);	
			$('<span class="desc-name"></span>').append(similars_a).appendTo(similars_p).append(document.createTextNode(':'));
			var similars_text = $('<span class="desc-text"></span>').appendTo(similars_p);
			for (var i=0, l = similars.length; i < l; i++) {
				var similar = similars[i],
					arts_similar_node = $("<a class='js-serv'></a>")
					  .text(similar.name)
					  .attr({ 
						href: similar.url, 
						'class' : 'artist js-serv' 
					  })
					  .data('artist', similar.name )
					  .appendTo(similars_text);//!using in DOM
			}
			ainf.meta_info.append(similars_p);
		}
		var artist_albums_container = seesu.artist_albums_container = $('<div class="artist-albums"></div>').append('<span class="desc-name">Albums:</span>').appendTo(ainf.meta_info);
		var artist_albums_text = $('<div class=""></div>').appendTo(artist_albums_container);
		if (artist_albums_container){
			
			var albums_link = $('<a class="js-serv get-artist-albums">get albums</a>')
				.click(function(){
					var _this = $(this);
					if (!_this.data('albums-loaded')){
						
						artist_albums_container.addClass('albums-loading');
						
						lfm('artist.getTopAlbums',{'artist': artist },function(r){
							if (typeof r != 'object') {return;}
							_sui.artist_albums_renderer(r, artist_albums_text);
							_this.data('albums-loaded', true);
							artist_albums_container.removeClass('albums-loading');
						});
						_this.text('hide them');
						seesu.track_event('Artist navigation', 'show artist info', artist);
					} else{
						_sui.toogle_art_alb_container(_this);
					}
				})
				.appendTo(artist_albums_text);
			artist_albums_container.data('albums_link', albums_link);
		}
		ainf.bio.parent().removeClass('background-changes');
	
	},
	artist_albums_renderer: function(r, container){
		var sui = this;
		var albums = r.topalbums.album;
		var albums_ul = $('<ul></ul>');
		if (albums){
			
			var create_album = function(al_name, al_url, al_image, al_artist){
				var li = $('<li></li>').appendTo(albums_ul);
				var a_href= $('<a></a>')
					.attr('href', al_url )
					.data('artist', al_artist)
					.data('album', al_name)
					.click(function(e){
						e.preventDefault(); 
						_sui.toogle_art_alb_container(seesu.artist_albums_container.data('albums_link'));
						_sui.views.show_playlist_page('(' + al_artist + ') ' + al_name ,'album');
						get_artist_album_info(al_artist, al_name, get_artist_album_playlist );
						seesu.track_event('Artist navigation', 'album', al_artist + ": " + al_name);
						return false;
					})
					.appendTo(li);
				$('<img/>').attr('src', al_image).appendTo(a_href);
				$('<span class="album-name"></span>').text(al_name).appendTo(a_href);
			};
			if (albums.length) {
				for (var i=0; i < albums.length; i++) {
					create_album(albums[i].name, albums[i].url, (albums[i].image && albums[i].image[1]['#text']) || '', albums[i].artist.name);
					
				}
			} else if (albums.name){
				create_album(albums.name, albums.url, (albums.image && albums.image[1]['#text']) || '', albums.artist.name );
			}
			
		} else {
			albums_ul.append('<li>No albums information</li>');
		}
		container.append(albums_ul);
	},
	toogle_art_alb_container: function(link){
		if (seesu.artist_albums_container.is('.collapse-albums')){
			seesu.artist_albums_container.removeClass('collapse-albums');
			link.text('hide them');
		} else{
			seesu.artist_albums_container.addClass('collapse-albums');
			link.text('show them');
		}
	},
	render_playlist: function(pl, not_clear) { // if links present than do full rendering! yearh!
		var _sui = this;
		var ui = _sui.views.get_playlist_c();
		if (!not_clear){
			ui.empty();
		}
		seesu.ui.els.make_trs.show().data('pl', _sui.views.browsing.mpl = pl);
		if (!pl){
			$(ul).append('<li>Nothing found</li>');
		} else {
			pl.ui = ui;
			if (!seesu.now_playing.link){
				if (seesu.start_screen){
					$('<p></p>').attr('id', 'now-play-b').append(
						seesu.now_playing.link = $('<a></a>').text('Now Playing').attr('class', 'js-serv').click(function(){
							_sui.views.show_now_playing();
						})
					).appendTo(seesu.start_screen);
				}
				
			}
			for (var i=0, l = pl.length; i < l; i++) {
				
				pl.ui.append(
					_sui.create_playlist_element(pl[i])
				);
				if (pl[i].mo_pla){
					_sui.make_pl_element_playable(pl[i]);
				}
			}
			
			//get mp3 for each prepaired node (do many many delayed requests to mp3 provider)
		
			
			return true;
		}
	},
	make_pl_element_playable: function(mo){
		mo.mo_pla.node = mo.node;
		mo.node
			.find('a.song-duration').remove().end()
			.addClass('song')
			.removeClass('search-mp3-failed')
			.removeClass('waiting-full-render')
			.data('mo_pla', mo.mo_pla)
			.unbind()
			.click(function(){
				seesu.ui.views.save_view(mo.plst_titl);
				seesu.player.song_click(mo.mo_pla);
			});
		
		if (mo.mo_pla.from != 'vk_api'){
			var mp3 = $("<a></a>").text('mp3').attr({ 'class': 'download-mp3', 'href':  mo.mo_pla.link });
			mp3.insertBefore(mo.node);
		} else{
			mo.node.addClass('mp3-download-is-not-allowed');
		}
		
		if (mo.mo_pla.duration) {
			var digits = mo.mo_pla.duration % 60;
			var track_dur = (Math.round(mo.mo_pla.duration/60)) + ':' + (digits < 10 ? '0'+digits : digits );
			mo.node.prepend($('<a class="song-duration"></a>').text(track_dur + ' '));
		}
	},
	create_playlist_element: function(mo_titl){
		var track = $("<a></a>")
			.data('mo_titl', mo_titl)
			.data('artist_name', mo_titl.artist)
			.addClass('track-node waiting-full-render')
			.click(empty_song_click),
			li = document.createElement('li');
			
		
		mo_titl.node = track;
		
		if (!!mo_titl.track){
			track.text(mo_titl.artist + ' - ' + mo_titl.track);
		} else{
			track.text(mo_titl.artist);
		}
		if (mo_titl.link) {
			make_node_playable(mo_titl, mo_titl);
		} else if (mo_titl.mo_pla){
			make_node_playable(mo_titl, mo_titl.mo_pla);
		}
		return $(li)
			.data('mo_titl', mo_titl)
			.append(play_controls.node.clone(true))
			.append(track);
	},
	lfm_logged : function(){
		dstates.add_state('body', 'lfm-auth-done')
		$('.lfm-finish input[type=checkbox]').attr('checked', 'checked');
		$('#scrobbling-switches').find('input').attr('disabled', '');
	},
	views: {
		browsing:{},
		playing:false,
		current_rc: false,
		get_search_rc: function(){
			if (this.browsing.search_results){
				return (this.current_rc = this.browsing.search_results);
			} else {
				return (this.current_rc = this.browsing.search_results = $('<div class="search-results-container current-src"></div').appendTo(seesu.ui.els.searchres));
			}
		},
		get_playlist_c:function(){
			if (this.browsing.playlist){
				return this.browsing.playlist;
			} else {
				return (this.browsing.playlist = $('<ul class="tracks-c current-tracks-c"></ul>').appendTo(seesu.ui.els.artsTracks));
			}
		},
		save_view: function(pl, not_make_playable){
			if (this.playing && pl == this.playing.pl){
				return true;
			} else{					
				this.browsing.pl = pl;
				if (this.playing){
					if (this.playing.search_results){
						if (!this.browsing.with_search_results_link || (this.playing.search_results[0] != (this.current_rc && this.current_rc[0]))){
								this.playing.search_results.remove();
						}
					}
					
					if (this.playing.playlist){
						this.playing.playlist.remove();
					}
					
				}
				this.playing = this.browsing;
				this.browsing = {};
				if (!not_make_playable){
					make_tracklist_playable(pl, false, true);
				}
				
			}
			
		},
		restore_view: function(){
			this.hide_browsing();
			if (this.playing.search_results){
				this.current_rc = this.playing.search_results;
			}
			if (this.playing){
				this.show_playlist_page(
					this.playing.playlist_title, 
					this.playing.playlist_type, 
					this.playing.with_search_results_link,
					true
				);
			}
			
		},
		show_playing: function(){
			if (this.playing.search_results){
				this.current_rc = this.playing.search_results.show();
			}
			if (this.playing.playlist){
				this.playing.playlist.show();
			}
		},
		hide_playing: function(){
			
			if (this.playing.search_results && (this.playing.search_results[0] != (this.current_rc && this.current_rc[0]))){
				this.playing.search_results.hide();
			
			}
			
			
			if (this.playing.playlist){
				this.playing.playlist.hide();
			}
				
			
		},
		show_browsing: function(){
			if (this.browsing.search_results){
				this.current_rc = this.browsing.search_results.show();
			}
			if (this.browsing.playlist){
				this.browsing.playlist.show();
			}
		},
		hide_browsing: function(){
			if (this.browsing.search_results){
				this.browsing.search_results.hide();
			}
			if (this.browsing.playlist){
				this.browsing.playlist.hide();
			}
		},
		show_now_playing: function(){
			var current_page = seesu.ui.els.slider.className;
			this.restore_view();
			seesu.track_event('Navigation', 'now playing', current_page);
		},
		show_start_page: function(focus_to_input, log_navigation){
			var _s;
			if (log_navigation){
				_s = seesu.ui.els.slider.className;
			}
			seesu.ui.els.slider.className = "show-start";
			if (focus_to_input){
				seesu.ui.els.search_input[0].focus();
				seesu.ui.els.search_input[0].select();
			}
			if (log_navigation){
				seesu.track_page('start page');
			}
			this.current_rc = false;
			this.hide_playing();
			this.show_browsing();
		},
		show_search_results_page: function(without_input, log_navigation){
			var _s;
			if (log_navigation){
				_s = seesu.ui.els.slider.className;
			}
			seesu.ui.els.slider.className = (without_input ? '' : 'show-search ') + "show-search-results";
			if (log_navigation){
				seesu.track_page('search results');
			}
		},
		show_playlist_page: function(playlist_title, playlist_type, with_search_results_link, show_playing){
			var _sui = this;
			if (show_playing){
				this.show_playing();
				seesu.ui.els.make_trs.show().data('pl', this.playing.mpl);
			} else {
				this.hide_playing();
				this.show_browsing();
				seesu.ui.els.make_trs.show().data('pl', this.browsing.mpl);
			}

			if (playlist_title){
				$(nav_playlist_page).text(this.browsing.playlist_title = playlist_title);
			}
			if (playlist_type){
				this.browsing.playlist_type = _sui.playlist_type = playlist_type;
			}
			if (with_search_results_link) {
				this.browsing.with_search_results_link = true;
				seesu.now_playing.nav = seesu.ui.els.slider.className = 'show-full-nav show-player-page';
			} else {
				this.browsing.with_search_results_link = false;
				seesu.now_playing.nav = seesu.ui.els.slider.className = 'show-player-page';
			}
		}
	}



}