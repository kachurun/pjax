(function($) {

  var Paginator = function(container, options) {
    var self = this;

    self.container = container;
    self.pagination = options.pagination;
    self.lazyLoad = options.lazyLoad;
    self.lazyContainer = options.lazyContainer;
    self.lazyDynamic = options.lazyDynamic;
    self.lazyDynamicTimeout = options.lazyDynamicTimeout;
    self.url = '';
    self.query = options.query;
    self.params = options.params;
    self.special_params = options.special_params;
    self.method = options.method;
    self.cache = options.cache;
    self.fromCache = false;
    self.callbacks = options.callbacks;

    // events on pagination
    self.eventHandle(true);

    // if query was set, preload page via ajax
    if (self.query) {
      self.ajaxLoad(self.container);
    }

    //cacheControl
    setInterval(function() {
      self.cacheControl();
    }, 1000);
  };

  // default settings
  Paginator.default = {
    pagination: '',
    lazyLoad: null,
    lazyContainer: null,
    lazyDynamic: false,
    lazyDynamicTimeout: 500,
    query: '',
    params: {},
    special_params: {},
    method: 'GET',
    cache: {
      enabled: true,
      tll: 60,
      items: []
    },
    callbacks: {
      beforeLoad: null,
      afterLoad: null,
      onError: null
    }
  };

  // pagination events
  Paginator.prototype.eventHandle = function(global) {
    var self = this;
    // global events
    if (global) {
      // popstate changed. Run at forward\backward action
      window.removeEventListener('popstate', _popstate, false);
      window.addEventListener('popstate', _popstate, false);

      // on page scroll. if lazyDynamic true
      if (self.lazyDynamic) {
        window.removeEventListener('scroll', _pageScroll, false);
        window.addEventListener('scroll', _pageScroll, false);
      }

      function _popstate(e) {
        self.url = location.pathname + location.search;
        self.query = location.pathname;
        self.params = $.parseParams(location.search.split('?')[1] || '');

        // load page content
        self.ajaxLoad(self.container, true);
      };

      function _pageScroll() {
        var $lazyLoad = $(self.lazyLoad);
        if ($lazyLoad.length === 0) return false;
        // set a timeout after which simulate a click on the lazyLoad button
        clearTimeout($lazyLoad.data('timeout'));
        var timer = setTimeout(function() {
          var anchor;
          if ($lazyLoad.css('display') === 'none') {
            $lazyLoad.css('display', 'inline-block');
            anchor = $lazyLoad.offset().top;
            $lazyLoad.css('display', 'none');
          } else {
            anchor = $lazyLoad.offset().top;
          }

          if ( $(document).scrollTop() + $(window).height() > anchor ) {
            $lazyLoad.trigger('click');
          }
        }, self.lazyDynamicTimeout);
        $lazyLoad.data('timeout', timer);
      }
    }
    // pagination keys
    if (self.pagination) {
      $(self.pagination).on('click', function(e) {
        e.preventDefault();

        // set query and params for request
        self.url = $(this).attr('href');
        self.query = _parseUrl(self.url)[0];
        self.params = _parseUrl(self.url)[1];

        // ajax page load
        self.ajaxLoad(self.container);
      });
    }
    // paginations lazy load button
    if (self.lazyLoad && self.lazyContainer) {
      $(self.lazyLoad).on('click', function(e){
        e.preventDefault();

        // set query and params for request
        self.url = $(this).attr('href');
        self.query = _parseUrl(self.url)[0];
        self.params = _parseUrl(self.url)[1];

        // ajax page load.
        // lazy flag on
        self.isLazy = true;
        self.ajaxLoad(self.lazyContainer);
      });
    }

  };

  // load page via ajax
  Paginator.prototype.ajaxLoad = function(container, nohistory) {
    var self = this;
    var history = !nohistory;
    var params = $.extend({}, self.params, self.special_params);
    var cache_id = self.query+'_'+$.param(params);
    var cache_index = $.findByKey(self.cache.items, {id: cache_id});

    // beforeLoad callback
    self.callback('beforeLoad', self);

    // find it in cache first and load
    if (self.cache.enabled && cache_index) {
      self.fromCache = true;
      // insert into or replace with container
      if (self.isLazy) {
        // insert instead container
        $(container).replaceWith(self.cache.items[cache_index].data);
      } else {
        // insert into container
        $(container).html(self.cache.items[cache_index].data);
      }
      // update events
      self.eventHandle();

      // set history
      if (history) self.historyAdd();

      // afterLoad callback
      self.callback('afterLoad', $.extend({}, self));
      return;
    }

    $.ajax({
        method: self.method,
        url: self.query,
        data: params,
        dataType: 'html',
      })
      .done(function(data) {
        if (data) {
          self.fromCache = false;
          // add to cache element
          if (self.cache.enabled) {
            self.cache.items.push({
              create: Math.floor(new Date().getTime() / 1000),
              id: cache_id,
              data: data
            });
          }

          if (self.isLazy) {
            // insert instead container
            $(container).replaceWith(data);
          } else {
            // insert into container
            $(container).html(data);
          }

          // update events
          self.eventHandle();

          // set history
          if (history) self.historyAdd();

          // afterLoad callback
          self.callback('afterLoad', $.extend({},self));
        } else {
          // onError callback
          self.callback('onError', {status: 'empty-response', statusText: 'Empty Response from server'});
        }
      })
      .fail(function(error){
        // onError callback
        self.callback('onError', error);
      });

  };

  // history add
  Paginator.prototype.historyAdd = function() {
    var self = this;
    //html5 history api
    history.pushState(null, null, self.query+'?'+$.param(self.params));
    // lazy flag off
    self.isLazy = false;
  }

  // remove old cache
  Paginator.prototype.cacheControl = function() {
      var self = this,
          now = Math.floor(new Date().getTime() / 1000);

      for (var i in self.cache.items) {
        if (now > self.cache.items[i].create + self.cache.tll) {
          self.cache.items.splice(i, 1);
        }
      }
  };

  // setparams method
  Paginator.prototype.setParams = function(options, autoload){
    var self = this;

    if (typeof options == 'object') {
      for (var i in options){
        if (i in self) {
          self[i] = options[i];
        }
      }
      if (autoload)
        self.ajaxLoad();
    }
  };

  // callback
  Paginator.prototype.callback = function(name, data) {
    var self = this;
    if (typeof self.callbacks[name] == 'function')
      self.callbacks[name](data);
  };

  // return parsed url, e.g http://mysite.com/?p1=value1&p2=value2
  // returned ['http://mysite.com/', {p1:value1, p2:value2}]
  function _parseUrl(url) {
    var result = [];
    result.push( url.split('?')[0] || url );
    result.push( $.parseParams(url.split('?')[1] || '') );
    return result;
  }

  $.fn.pjax = function(options) {
    var args = Array.prototype.slice.call(arguments, 1);
    return this.each(function() {
      var $this = $(this),
        data = $this.data('pjax');
      if (!data) {
        var settings = $.extend({}, Paginator.default, $this.data(), typeof options == 'object' && options);
        $this.data('pjax', new Paginator($this, settings));
      } else {
        if (typeof data[options] === 'function') {
          data[options].apply(data, args);
        }
      }
    });
  };
})(jQuery);


// -------------------------------------------------------------------------- common
/*
* Find By key
* used for search object index in array of objects
* See example at http://jsfiddle.net/kachurun/mgacd3at/
*/
(function ($) {
    $.findByKey = function (array, find) {
        var result = [];
        array.forEach(function (object, index) {
            for (var key in find) {
                var value = find[key];
                var key = key.split('.');
                var temp = (JSON.parse(JSON.stringify(object)));
                key.forEach(function (keyv, keyi) {
                    if (keyv in temp) {
                        temp = temp[keyv];
                        if (key.length - 1 === keyi && value == temp) {
                            result.push(index);
                        }
                    }
                });
            }

        });
        if (!result.length) {
            result = null;
        }
        return result;
    };
})(jQuery);

/**
 * $.parseParams - parse query string paramaters into an object. Reverse of jQuery.param
 * gist.github.com/kares/956897
 * Use:
 * $.parseParams('q=1&tyu=4')
 * $.parseParams('example.com/?q=1&tyu=4'.split('?')[1] || '')
 */
(function($) {
  var re = /([^&=]+)=?([^&]*)/g;
  var decodeRE = /\+/g; // Regex for replacing addition symbol with a space
  var decode = function(str) {
    return decodeURIComponent(str.replace(decodeRE, " "));
  };
  $.parseParams = function(query) {
    var params = {},
      e;
    if (typeof query === 'string') {
      query = query.replace('amp;','').replace('amp%3B','').replace('&%3B','&');
    }

    while (e = re.exec(query)) {
      var k = decode(e[1]),
        v = decode(e[2]);
      if (k.substring(k.length - 2) === '[]') {
        k = k.substring(0, k.length - 2);
        (params[k] || (params[k] = [])).push(v);
      } else params[k] = v;
    }
    return params;
  };
})(jQuery);
