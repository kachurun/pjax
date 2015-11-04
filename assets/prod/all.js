(function(){
  $(function(){
    $('#container').pjax({
      pagination: '.pagination-container .pagination a',
      special_params: {
        is_ajax: true
      },
      callbacks: {
        afterLoad: function(obj){
          console.log(obj);
        },
        onError: function(err){
          console.log(err);
        }
      }
    });

  });
})();

(function($) {

  var Paginator = function(container, options) {
    var self = this;

    this.container = container;
    this.pagination = options.pagination;
    this.query = options.query;
    this.params = options.params;
    this.special_params = options.special_params;
    this.method = options.method;
    this.cache = options.cache;
    this.fromCache = false;
    this.callbacks = options.callbacks;

    // events on pagination
    self.eventHandle();

    // if query was set, load page via ajax
    if (self.query) {
      self.ajaxLoad();
    }

    // EVENT: state changed. Run at forward\backward action
    var popstate = function(e) {
      console.log(e);
      console.log(location);
      self.query = location.pathname;
      self.params = $.parseParams(location.search.split('?')[1] || '');
      // load page content
      self.ajaxLoad();
    };

    window.removeEventListener('popstate', popstate, false);
    window.addEventListener('popstate', popstate, false);

    //cacheControl
    setInterval(function() {
      self.cacheControl();
    }, 1000);
  };

  // default settings
  Paginator.default = {
    pagination: '',
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
  Paginator.prototype.eventHandle = function() {
    var self = this;
    if (self.pagination) {
      $(self.pagination).on('click', function(e) {
        e.preventDefault();
        var url = $(this).attr('href');

        self.query = url.split('?')[0] || url;
        self.params = $.parseParams(url.split('?')[1] || '');

        // history api: set path
        history.pushState(null, null, url);
        // ajax page load
        self.ajaxLoad();
      });
    }
  };

  // load page via ajax
  Paginator.prototype.ajaxLoad = function() {
    var self = this,
        params = $.extend(self.params, self.special_params),
        cache_id = self.query+'_'+$.param(params),
        cache_index = $.findByKey(self.cache.items, {id: cache_id});

    // beforeLoad callback
    self.callback('beforeLoad', self);
    // find it in cache first
    if (self.cache.enabled && cache_index) {
      self.fromCache = true;
      // insert into container
      $(self.container).html(self.cache.items[cache_index].data);
      // update events
      self.eventHandle();
      // afterLoad callback
      self.callback('afterLoad', self);
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
          //cache element
          if (self.cache.enabled) {
            self.cache.items.push({
              create: Math.floor(new Date().getTime() / 1000),
              id: cache_id,
              data: data
            });
          }
          // insert into container
          $(self.container).html(data);
          // update events
          self.eventHandle();
          // afterLoad callback
          self.callback('afterLoad', self);
        } else {
          alert('Empty response');
        }
      })
      .fail(function(error){
        alert(error);
        // onError callback
        self.callback('onError', error);
      });
  };

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
(function($) {
  $.findByKey = function(array, find) {
    var result = [];
    array.forEach(function(value, index) {

      for (var key in value) {
        if (value[key] == find[key]) {
          result.push(index);
        }
      }

    });

    if (!result.length) {
      result = null;
    }
    return result;
  }
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
