/*
	util.js
	Copyright © 2005-2012  WOT Services Oy <info@mywot.com>

	This file is part of WOT.

	WOT is free software: you can redistribute it and/or modify it
	under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	WOT is distributed in the hope that it will be useful, but WITHOUT
	ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
	or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
	License for more details.

	You should have received a copy of the GNU General Public License
	along with WOT. If not, see <http://www.gnu.org/licenses/>.
*/

var wot_util =
{
	isenabled: function()
	{
		try {
			return (wot_prefs.enabled &&
					wot_api_register.ready &&
						(!wot_prefs.private_disable ||
						 !wot_browser.isprivatemode()));
		} catch (e) {
			dump("wot_util.isenabled: failed with " + e + "\n");
		}

		return true;
	},

	getstring: function(str, arr)
	{
		try {
			if (!this.string_bundle) {
				this.string_bundle = document.getElementById("wot-strings");
			}
			if (arr) {
				return this.string_bundle.getFormattedString(str, arr);
			} else {
				return this.string_bundle.getString(str);
			}
		} catch (e) {
			dump("wot_util.getstring: failed with " + e + "\n");
		}

		return null;
	}
};

var wot_url =
{
	gethostname: function(url)
	{
		try {
			if (!url || !url.length) {
				return null;
			}

			var ios = Components.classes["@mozilla.org/network/io-service;1"]
						.getService(Components.interfaces.nsIIOService);

			var parsed = ios.newURI(url, null, null);

			if (!parsed || !parsed.host ||
					!this.issupportedscheme(parsed.scheme)) {
				return null;
			}

			var host = parsed.host.toLowerCase();

			if (!host) {
				return null;
			}

			while (this.isequivalent(host)) {
				host = host.replace(/^[^\.]*\./, "");
			}

			return wot_shared.encodehostname(host, parsed.path);
		} catch (e) {
			/* dump("wot_url.gethostname: failed with " + e + "\n"); */
		}

		return null;
	},

	issupportedscheme: function(scheme)
	{
		try {
			return /^(https?|ftp|mms|rtsp)$/i.test(scheme);
		} catch (e) {
			dump("wot_url.issupportedscheme: failed with " + e + "\n");
		}

		return false;
	},

	isequivalent: function(name)
	{
		try {
			if (!/^www(\d[^\.]*)?\..+\..+$/i.test(name)) {
				return false;
			}

			var component = Components
					.classes["@mozilla.org/network/effective-tld-service;1"];

			if (!component) {
				return true;
			}

			var ts = component.getService(
						Components.interfaces.nsIEffectiveTLDService);

			if (!ts) {
				return true;
			}
			
			var domain = name.replace(/^[^\.]*\./, "");
			var tld = ts.getPublicSuffixFromHost(domain);

			return (domain != tld);
		} catch (e) {
			dump("wot_url.isequivalent: failed with " + e + "\n");
		}

		return false;
	},

	isprivate: function(name)
	{
		try {
			/* This isn't meant to be a comprehensive check, just notice the most
			   common local and private addresses */
			return /^(localhost|((10|127)\.\d+|(172\.(1[6-9]|2[0-9]|3[01])|192\.168))\.\d+\.\d+)$/.test(name);
		} catch (e) {
			dump("wot_url.isprivate: failed with " + e + "\n");
		}

		return false;
	},

	isexcluded: function(name)
	{
		try {
			if (!name || !wot_prefs.norepsfor ||
					wot_prefs.norepsfor.length == 0) {
				return false;
			}

			var hosts = wot_prefs.norepsfor.replace(/\s/g, "").split(",");

			for (var i = 0; i < hosts.length; ++i) {
				if (hosts[i].length == 0) {
					continue;
				}

				if (hosts[i].charAt(0) == '.') {
					if (name.length > hosts[i].length &&
							name.lastIndexOf(hosts[i]) ==
								(name.length - hosts[i].length)) {
						return true;
					}
				} else if (hosts[i].charAt(hosts[i].length - 1) == '.') {
					if (name.indexOf(hosts[i]) == 0) {
						return true;
					}
				} else if (name == hosts[i]) {
					return true;
				}
			}
		} catch (e) {
			dump("wot_url.isexcluded: failed with " + e + "\n");
		}

		return false;
	},

	getwoturl: function(path, context)
	{
		try {
			/* We'll ignore context for now */
			return WOT_MY_URL + path;
		} catch (e) {
			dump("wot_url.getwoturl: failed with " + e + "\n");
		}

		return null;
	},

	getprefurl: function(tab, secure, base)
	{
		try {
			base = base || WOT_PREF_PATH;

			var path = base + wot_util.getstring("language") +
						"/" + WOT_PLATFORM + "/" + WOT_VERSION;

			var url = this.getwoturl(path);

			if (url) {
				if (tab) {
					url += "/" + tab;
				}

				if (secure) {
					url = url.replace(/^http\:/, "https:");
				}

				return url;
			}
		} catch (e) {
			dump("wot_url.getprefurl: failed with " + e + "\n");
		}

		return null;
	},

	getapiparams: function()
	{
		try {
			var params = "&lang=" +
				(wot_util.getstring("language") || "en-US");

			var partner = wot_partner.getpartner();

			if (partner) {
				params += "&partner=" + partner;
			}

			params += "&version=" + WOT_PLATFORM + "-" + WOT_VERSION;
			return params;
		} catch (e) {
			dump("wot_url.getapiparams: failed with " + e + "\n");
		}

		return "";
	}
};

var wot_browser =
{
	isoffline: function()
	{
		try {
			var ios = Components.classes["@mozilla.org/network/io-service;1"]
						.getService(Components.interfaces.nsIIOService);

			return ios.offline;
		} catch (e) {
			dump("wot_browser.isoffline: failed with " + e + "\n");
		}

		return false;
	},

	isprivatemode: function()
	{
		try {
			var pbs = Components.classes["@mozilla.org/privatebrowsing;1"]
						.getService(Components.interfaces.nsIPrivateBrowsingService);

			return pbs.privateBrowsingEnabled;
		} catch (e) {
		}

		return false;
	},

	gethostname: function()
	{
		return wot_url.gethostname(this.geturl());
	},

	geturl: function()
	{
		try {
			return getBrowser().contentDocument.location.href;
		} catch (e) {
		}

		return null;
	},

	getreferrer: function()
	{
		try {
			return getBrowser().contentDocument.referrer;
		} catch (e) {
			dump("wot_browser.getreferrer: failed with " + e + "\n");
		}

		return null;
	},

	show_warning: function(hostname, message, unknown)
	{
		try {
			var icon = "chrome://wot/skin/fusion/";

			if (wot_prefs.accessible) {
				icon += "accessible/";
			}

			if (unknown) {
				icon += "16_16/plain/danger.png";
			} else {
				icon += "16_16/plain/no_rep_available.png";
			}

			/* There's a chance the user has already changed the tab */
			if (hostname != wot_browser.gethostname()) {
				return;
			}

			var browser = getBrowser();

			if (!browser) {
				return;
			}

			if (browser.getNotificationBox) {
				/* Firefox 2 */
				var nbox = browser.getNotificationBox();

				if (!nbox || nbox.getNotificationWithValue("wot-warning")) {
					return;
				}

			    var buttons = [{
					label: wot_util.getstring("warning_button"),
					accessKey: null,
					popup: "wot-popup",
					callback: null
				}];

			    nbox.appendNotification(
					wot_util.getstring("warning", [message]),
					"wot-warning",
					icon, nbox.PRIORITY_WARNING_HIGH, buttons);
			} else {
				browser.hideMessage(browser.selectedBrowser, "both");
				browser.showMessage(browser.selectedBrowser, icon,
					wot_util.getstring("warning", [message]),
					wot_util.getstring("warning_button"),
					null, null, "wot-popup", "top", true, null);
			}
		} catch (e) {
			dump("wot_browser.show_warning: failed with " + e + "\n");
		}
	},

	hide_warning: function()
	{
		try {
			var browser = getBrowser();

			if (!browser) {
				return;
			}

			if (browser.getNotificationBox) {
				var nbox = browser.getNotificationBox();

				if (!nbox) {
					return;
				}

				var item = nbox.getNotificationWithValue("wot-warning");

				if (!item) {
					return;
				}

				nbox.removeNotification(item);
			} else {
				browser.hideMessage(browser.selectedBrowser, "both");
			}
		} catch (e) {
			dump("wot_browser.hide_warning: failed with " + e + "\n");
		}
	},

	openscorecard: function(hostname, action, content)
	{
		try {
			if (!hostname) {
				return false;
			}
			
			var path = WOT_SCORECARD_PATH + encodeURIComponent(hostname);

			if (action) {
				path += action;
			}

			var browser = getBrowser();
			var url = wot_url.getwoturl(path, content);

			if (browser && url) {
				browser.selectedTab = browser.addTab(url);
				return true;
			}
		} catch (e) {
			dump("wot_browser.openscorecard: failed with " + e + "\n");
		}

		return false;
	},

	installsearch: function()
	{
		try {
			wot_prefs.setBool("install_search", false);

			var bss = Components.classes["@mozilla.org/browser/search-service;1"]
						.getService(Components.interfaces.nsIBrowserSearchService);

			var url = WOT_SAFESEARCH_OSD_URL;
			var lang = wot_util.getstring("language");

			if (lang) {
				url = url.replace("/en-US", "/" + lang);
			}

			bss.addEngine(url, 1, null, false);
		} catch (e) {
			dump("wot_browser.installsearch: failed with " + e + "\n");
		}
	}
};

/* Provides a simple wrapper for nsICryptoHash */
var wot_hash =
{
	load_delayed: function()
	{
		try {
			if (this.handle) {
				return;
			}
			this.handle = Components.classes["@mozilla.org/security/hash;1"].
	                        getService(Components.interfaces.nsICryptoHash);

			window.addEventListener("unload", function(e) {
					wot_hash.unload();
				}, false);
		} catch (e) {
			dump("wot_hash.load: failed with " + e + "\n");
		}
	},

	unload: function()
	{
		this.handle = null;
	},

	/* Converts a string of bytes (code < 256) to an array of bytes, don't
	   use for multibyte strings */
	strtobin: function(str)
	{
		try {
			var bin = [];

			for (var i = 0; i < str.length; ++i) {
				bin[i] = str.charCodeAt(i) & 0xFF;
			}
			return bin;
		} catch (e) {
			dump("wot_hash.strtobin: failed with " + e + "\n");
		}
		return null;
	},

	/* Converts an array of bytes to a string of bytes */
	bintostr: function(bin)
	{
		try {
			var str = "";

			for (var i = 0; i < bin.length; ++i) {
				str += String.fromCharCode(bin[i] & 0xFF);
			}

			return str;
		} catch (e) {
			dump("wot_hash.bintostr: failed with " + e + "\n");
		}
		return null;
	},

	/* Converts a hex string to an array of bytes */
	hextobin: function(str)
	{
		try {
			/* We assume ASCII-compatible values for basic alnums */
			var asciitonibble = function(c)
			{
				var code_a = 'a'.charCodeAt(0);

				if (c >= code_a) {
					return (c - code_a + 10);
				} else {
					return (c - '0'.charCodeAt(0));
				}
			}
			var bin = [];

			for (var i = 0; i < str.length / 2; ++i) {
				bin[i] = asciitonibble(str.charCodeAt(2 * i    )) <<  4 |
						 asciitonibble(str.charCodeAt(2 * i + 1)) & 0xF;
			}
			return bin;
		} catch (e) {
			dump("wot_hash.hextobin: failed with " + e + "\n");
		}
		return null;
	},

	/* Converts an array of bytes to a hex string */
	bintohex: function(bin)
	{
		const HEX = "0123456789abcdef";
		var str = "";

		try {
			for (var i = 0; i < bin.length; ++i) {
				str += HEX.charAt((bin[i] >> 4) & 0xF);
				str += HEX.charAt( bin[i]       & 0xF);
			}
			return str;
		} catch (e) {
			dump("wot_hash.bintohex: failed with " + e + "\n");
		}
		return null;
	},

	/* Returns an array of bytes containing the SHA-1 hash from the given
	   array of bytes */
	sha1bin: function(bin)
	{
		try {
			this.handle.init(Components.interfaces.nsICryptoHash.SHA1);
			this.handle.update(bin, bin.length);

			/* Takes an array, but returns a string? */
			return this.strtobin(this.handle.finish(false));

		} catch (e) {
			dump("wot_hash.sha1bin: failed with " + e + "\n");
		}
		return null;
	},

	/* Returns an array of bytes containing the SHA-1 hash from the given
	   string of bytes */
	sha1str: function(str)
	{
		return this.sha1bin(this.strtobin(str));
	},

	/* Returns an array of bytes containing the SHA-1 hash from the given
	   hex string */
	sha1hex: function(str)
	{
		return this.sha1bin(this.hextobin(str));
	},

	/* Returns an array of bytes containing the HMAC-SHA-1 from the given
	   string of bytes using the given hex string key */
	hmac_sha1hex: function(hexkey, str)
	{
		try {
			var key = this.hextobin(hexkey);

			if (key.length > 20) {
				key = this.sha1bin(key);
			}

			var ipad = Array(64), opad = Array(64);

			for (var i = 0; i < 20; ++i) {
				ipad[i] = key[i] ^ 0x36;
				opad[i] = key[i] ^ 0x5C;
			}
			for (var j = 20; j < 64; ++j) {
				ipad[j] = 0x36;
				opad[j] = 0x5C;
			}

			var inner = this.sha1bin(ipad.concat(this.strtobin(str)));
			return this.sha1bin(opad.concat(inner));
		} catch (e) {
			dump("wot_hash.hmac_sha1hex: failed with " + e + "\n");
			return null;
		}
	}
};

wot_modules.push({ name: "wot_hash", obj: wot_hash });

var wot_arc4 =
{
	/* Takes a key as an array of bytes, returns a context */
	create: function(key)
	{
		try {
			var i, j = 0, k = 0, l;
			var ctx = {};

			ctx.s = [];
			ctx.x = 1;
			ctx.y = 0;

			for (i = 0; i < 256; ++i) {
				ctx.s[i] = i;
			}
			for (i = 0; i < 256; ++i) {
				l = ctx.s[i];
				j = (j + key[k] + l) & 0xFF;
				ctx.s[i] = ctx.s[j];
				ctx.s[j] = l;
				if (++k >= key.length) {
					k = 0;
				}
			}

			return ctx;
		} catch (e) {
			dump("trust_arc4.create failed with " + e + "\n");
			return null;
		}
	},

	/* Takes context and input as an array of bytes, returns crypted string
	   also as an array of bytes */
	crypt: function(ctx, input)
	{
		try {
			var i, j, k;
			var output = [];

			for (i = 0; i < input.length; ++i) {
				j = ctx.s[ctx.x];
				ctx.y = (ctx.y + j) & 0xFF;
				k = ctx.s[ctx.y];
				ctx.s[ctx.x] = k;
				ctx.s[ctx.y] = j;
				ctx.x = (ctx.x + 1) & 0xFF;
				output[i] = (input[i] ^ ctx.s[(j + k) & 0xFF]) & 0xFF;
			}

			return output;
		} catch(e) {
			dump("trust_arc4.crypt failed with " + e + "\n");
			return null;
		}
	}
};

const WOT_CRYPTO_COUNTER = "wot_crypto_counter";

var wot_crypto =
{
	load_delayed: function()
	{
		try {
			wot_hashtable.set(WOT_CRYPTO_COUNTER, Number(Date.now()));
		} catch (e) {
			dump("wot_crypto.load: failed with " + e + "\n");
		}
	},

	nonce: function()
	{
		try {
			var counter = wot_hashtable.get(WOT_CRYPTO_COUNTER);

			wot_hashtable.set(WOT_CRYPTO_COUNTER,
				Number(counter) + 1);

			return wot_hash.bintohex(wot_hash.sha1str(
						wot_prefs.witness_id +
						wot_prefs.update_checked +
						wot_prefs.cookie_updated +
						WOT_VERSION +
						wot_browser.geturl() +
						wot_browser.getreferrer() +
						counter +
						Date.now()));
		} catch (e) {
			dump("wot_crypto.nonce: failed with " + e + "\n");
		}

		return Date.now().toString();
	},

	getrandomid: function()
	{
		try {
			var id = this.nonce();

			if (/^[0-9]/.test(id)) {
				/* Convert the first character to a letter */
				id = String.fromCharCode(id.charCodeAt(0) + "1".charCodeAt(0)) +
						id.substr(1);
			}

			return id.substr(0, Math.floor(Math.random() * 13 + 8));
		} catch (e) {
			dump("wot_crypto.nonce: failed with " + e + "\n");
		}

		return null;
	},

	authenticate: function(str)
	{
		try {
			return wot_hash.bintohex(
				wot_hash.hmac_sha1hex(wot_prefs.witness_key, str));
		} catch (e) {
			dump("wot_crypto.authenticate: failed with " + e + "\n");
		}
		return null;
	},

	authenticate_query: function(str)
	{
		return str + "&auth=" + this.authenticate(str);
	},

	islevel: function(level)
	{
		try {
			var l = wot_prefs.status_level;

			if (!l || l.length != 40) {
				return false;
			}

			var h = wot_hash.bintohex(wot_hash.hmac_sha1hex(
						wot_prefs.witness_key, "level=" + level));

			return (l == h);
		} catch (e) {
			dump("wot_crypto.islevel: failed with " + e + "\n");
		}
		return false;
	}
};

wot_modules.push({ name: "wot_crypto", obj: wot_crypto });

/* Provides a simple wrapper for nsIIDNService */
var wot_idn =
{
	load: function()
	{
		try {
			if (this.handle) {
				return;
			}
			this.handle =
				Components.classes["@mozilla.org/network/idn-service;1"].
					getService(Components.interfaces.nsIIDNService);
		} catch (e) {
			dump("wot_idn.load: failed with " + e + "\n");
		}
	},

	unload: function()
	{
		this.handle = null;
	},

	isidn: function(str)
	{
		try {
			return this.handle.isACE(str);
		} catch (e) {
			dump("wot_idn.isidn: failed with " + e + "\n");
		}
		return false;
	},

	utftoidn: function(utf)
	{
		try {
			return this.handle.convertUTF8toACE(utf);
		} catch (e) {
			dump("wot_idn.utftoidn: failed with " + e + "\n");
		}
		return null;
	},

	idntoutf: function(idn)
	{
		try {
			return this.handle.convertACEtoUTF8(idn);
		} catch (e) {
			dump("wot_idn.idntoutf: failed with " + e + "\n");
		}
		return null;
	}
};

wot_modules.push({ name: "wot_idn", obj: wot_idn });

const WOT_STYLESHEET = "chrome://wot/skin/wot.css";

var wot_css =
{
	cache: {},

	/* Finds a given rule from a stylesheet, caches found entries */
	getstyle: function(href, id)
	{
		try {
			var rule = this.cache[href + "." + id];

			if (rule) {
				return rule.style;
			}

			var sheet;

			for (var i = 0; i < document.styleSheets.length; ++i) {
				sheet = document.styleSheets.item(i);

				if (sheet.href != href) {
					continue;
				}

				for (var j = 0; j < sheet.cssRules.length; ++j) {
					rule = sheet.cssRules.item(j);

					if (rule.selectorText.indexOf(id) < 0) {
						continue;
					}

					this.cache[href + "." + id] = rule;
					return rule.style;
				}
				break;
			}
		} catch (e) {
			dump("wot_css.getstyle: failed with " + e + "\n");
		}

		return null;
	},

	/* Parses a numeric entry from a style rule, ignores units */
	getstyle_numeric: function(style, parameter)
	{
		try {
			if (style) {
				var value = style[parameter];

				if (value) {
					var m = /^(\d+)/.exec(value);

					if (m && m[1]) {
						return Number(m[1]);
					}
				}
			}
		} catch (e) {
			dump("wot_css.getstyle_numeric: failed with " + e + "\n");
		}

		return null;
	},

	/* Sets a numeric entry with given unit to the style rule */
	setstyle_numeric: function(style, parameter, value, unit)
	{
		try {
			style[parameter] = value + unit;
		} catch (e) {
			dump("wot_css.setstyle_numeric: failed with " + e + "\n");
		}
	},

	/* Parses a rect entry from a style rule, ignores units */
	getstyle_rect: function(style, parameter)
	{
		try {
			if (style) {
				var value = style[parameter];

				if (value) {
					var r = /rect\(\s*(\d+)\D*,\s*(\d+)\D*,\s*(\d+)\D*,\s*(\d+)\D*\s*\)/;
					var m = r.exec(value);

					if (m && m[1] && m[2] && m[3] && m[4]) {
						return new Array(Number(m[1]), Number(m[2]),
							Number(m[3]), Number(m[4]));
					}
				}
			}
		} catch (e) {
			dump("wot_css.getstyle_rect: failed with " + e + "\n");
		}

		return null;
	},

	/* Sets a rect entry to the style rule, assumes pixels as unit */
	setstyle_rect: function(style, parameter, rect)
	{
		try {
			style[parameter] = "rect(" +
				rect[0].toFixed() + "px, " + rect[1].toFixed() + "px, " +
				rect[2].toFixed() + "px, " + rect[3].toFixed() + "px)";
		} catch (e) {
			dump("wot_css.setstyle_rect: failed with " + e + "\n");
		}
	}
};
