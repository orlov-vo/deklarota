var vk_captcha;

var vk_login = function(login,pass) {
	$.ajax({
	  url: "http://vkontakte.ru/login.php",
	  global: false,
	  type: "POST",
	  dataType: "json",
	  data: {
		'noredirect': '1',
		'email': login,
		'pass': pass
	  },
	  error: function(){
		log('����� �� �������');
	  },
	  success: function(r){
		var vk_id,vk_error;
		if (vk_error = r.error){
			vk_login_error.text('Wrong login or password')
		} else if (vk_captcha = r.captcha_sid){
			captcha_img.attr('src','http://vkontakte.ru/captcha.php?s=1&sid=' + vk_captcha);
			$(document.body).addClass('vk-needs-captcha');
		} else 	if (vk_id = r.id) {
			vk_logg_in(vk_id, r.email, r.sid);
			wait_for_vklogin && wait_for_vklogin();
		}
	  },
	  complete: function(xhr){
	  	log(xhr.responseText)
	  }
	});	
}
var vk_send_captcha = function(captcha_key,login,pass){
	$.ajax({
	  url: "http://vkontakte.ru/login.php",
	  global: false,
	  type: "POST",
	  dataType: "json",
	  data: {
		'op': 'a_login_attempt',
		'captcha_key': captcha_key,
		'captcha_sid': vk_captcha
   	  },
	  success: function(r){
	  	if (vk_captcha = r.captcha_sid){
	  		log(vk_captcha)
			captcha_img.attr('src','http://vkontakte.ru/captcha.php?s=1&sid=' + vk_captcha);
			$(document.body).addClass('vk-needs-captcha');
		}
	  },
	  complete: function(xhr){
	  	log(xhr.responseText)
		if ((xhr.responseText.indexOf('vklogin') != -1)){
			vk_captcha = 0;
			vk_login(login,pass);
			
		}
	  }
	});
}
var vk_logg_in = function(id,email,sid){
	widget.setPreferenceForKey(id, 'vkid');
	widget.setPreferenceForKey(email, 'vkemail');
	widget.setPreferenceForKey(sid, 'vk_sid');
	zz.viewer_id = seesu.vk_id = id;
	seesu.vk_logged_in = true;
	seesu.delayed_search.switch_to_vk();
	$(document.body).removeClass('vk-needs-login');
	
	log('hide vklogin form');
};
var vk_logged_out = function(){
	widget.setPreferenceForKey('', 'vkid');
	widget.setPreferenceForKey('', 'vkemail');
	widget.setPreferenceForKey('', 'vk_sid');
	log(widget.preferenceForKey('vkid'))
	seesu.vk_logged_in = false;
	log('display vklogin form if need')
	
};