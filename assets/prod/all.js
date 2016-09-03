(function() {
    $(function() {
        $('#container').pjax({
            pagination: '.pagination-container .pagination a',
            lazyLoad: '.load-more',
            lazyContainer: '.pagination-container',
            lazyDynamic: true,
            lazyDynamicTimeout: 5000,
            special_params: {
                isAjax: true
            },
            cache: {
                enabled: false
            },
            callbacks: {
                afterLoad: function(obj) {
                    console.log(obj);
                },
                onError: function(err) {
                    // console.log(err);
                }
            }
        });
    });
})();

(function($) {
    var Paginator = function(container, options) {
        var self = this;

        self.container = container;
        self.url = '';

        self.o = {};
        self.o.pagination = options.pagination;
        self.o.lazyLoad = options.lazyLoad;
        self.o.lazyContainer = options.lazyContainer;
        self.o.lazyDynamic = options.lazyDynamic;
        self.o.lazyDynamicTimeout = options.lazyDynamicTimeout;
        self.o.query = options.query;
        self.o.params = options.params;
        self.o.special_params = options.special_params;
        self.o.method = options.method;
        self.o.cache = options.cache || {};
        self.o.callbacks = options.callbacks;

        self.fromCache = false;
        self.pageLoad = false; // fix safari bug with popstate fire on page load

        // events on pagination
        self.eventHandle(true);

        // if query was set, preload page via ajax
        if (self.o.query) {
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
            if (self.o.lazyDynamic) {
                window.removeEventListener('scroll', _pageScroll, false);
                window.addEventListener('scroll', _pageScroll, false);
            }
        }

        // pagination keys
        if (self.o.pagination) {
            $(self.o.pagination).on('click', function(e) {
                e.preventDefault();

                // set query and params for request
                self.url = $(this).attr('href');
                self.o.query = _parseUrl(self.url)[0];
                self.o.params = _parseUrl(self.url)[1];

                // ajax page load
                self.ajaxLoad(self.container);
            });
        }

        // paginations lazy load button
        if (self.o.lazyLoad && self.o.lazyContainer) {
            $(self.o.lazyLoad).on('click', function(e) {
                e.preventDefault();
                // prevent lazyload on timeout after click
                clearTimeout($(self.o.lazyLoad).data('timeout'));

                // set query and params for request
                self.url = $(this).attr('href');
                if (!self.url) return;

                self.o.query = _parseUrl(self.url)[0];
                self.o.params = _parseUrl(self.url)[1];

                // ajax page load.
                // lazy flag on
                self.isLazy = true;
                self.ajaxLoad(self.o.lazyContainer);
            });
        }

        function _popstate(e) {
            self.url = location.pathname + location.search;
            self.o.query = location.pathname;
            self.o.params = $.parseParams(location.search.split('?')[1] || '');

            // load page content
            if (self.pageLoad) {
                self.ajaxLoad(self.container, true);
            }
        }

        function _pageScroll() {
            var $lazyLoad = $(self.o.lazyLoad);
            if (!$lazyLoad[0]) return false;

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

                if ($(document).scrollTop() + $(window).height() > anchor) {
                    $lazyLoad.trigger('click');
                }
            }, self.o.lazyDynamicTimeout);
            $lazyLoad.data('timeout', timer);
        }
    };

    // load page via ajax
    Paginator.prototype.ajaxLoad = function(container, nohistory) {
        var self = this;
        // prevent many requests
        if (self.inLoading) return;

        var history = !nohistory;
        var params = $.extend({}, self.o.params, self.o.special_params);
        var cache_id = self.o.query + '_' + $.param(params);
        var cache_index = $.findByKey(self.o.cache.items, {
            id: cache_id
        });

        // page loaded (safari bug fix)
        self.pageLoad = true;
        self.inLoading = true;

        // beforeLoad callback
        self.callback('beforeLoad', self);

        // find it in cache first and load
        if (self.o.cache.enabled && cache_index) {
            self.fromCache = true;
            // insert into or replace with container
            if (self.isLazy) {
                // insert instead container
                $(container).replaceWith(self.o.cache.items[cache_index].data);
            } else {
                // insert into container
                $(container).html(self.o.cache.items[cache_index].data);
            }
            // update events
            self.eventHandle();

            // afterLoad callback
            self.callback('afterLoad', $.extend({}, self));

            // set history
            if (history) self.historyAdd();

            self.inLoading = false;
            return;
        }

        // MOCK
        // setTimeout(function () {
        //     var data = [
        //                 '<div class="pagination-container">',
        //                     '<a href="/ajax/page2.html?page=2" class="button load-more">More...</a>',
        //                 '</div>'];
        //
        //     for (var i = 0, len = 2; i < len; i++) {
        //         data.unshift(['<div class="item">',
        //             '<div class="item-header">Item header ', i ,' </div>',
        //             '<div class="item-content">Item content</div>',
        //         '</div>'].join(''));
        //     }
        //     data = data.join('');
        //
        //     if (self.isLazy) {
        //         // insert instead container
        //         $(container).replaceWith(data);
        //     } else {
        //         // insert into container
        //         $(container).html(data);
        //     }
        //
        //     // update events
        //     self.eventHandle();
        //
        //     self.inLoading = false;
        // }, 300);
        // return;

        $.ajax({
            method: self.o.method,
            url: self.o.query,
            data: params,
            dataType: 'html',
        })
        .done(function(data) {
            if (data) {
                self.fromCache = false;
                // add to cache element
                if (self.o.cache.enabled) {
                    self.o.cache.items.push({
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

                // afterLoad callback
                self.callback('afterLoad', $.extend({}, self));

                // set history
                if (history) self.historyAdd();
            } else {
                // onError callback
                self.callback('onError', {
                    status: 'empty-response',
                    statusText: 'Empty Response from server'
                });
            }
            self.inLoading = false;
        })
        .fail(function(error) {
            // onError callback
            self.callback('onError', error);

            self.inLoading = false;
        });
    };

    // history add
    Paginator.prototype.historyAdd = function() {
        var self = this;
        //html5 history api
        history.pushState(null, null, self.o.query + '?' + $.param(self.o.params));
        // lazy flag off
        self.isLazy = false;
    };

    // remove old cache
    Paginator.prototype.cacheControl = function() {
        var self = this,
            now = Math.floor(new Date().getTime() / 1000);

        for (var i in self.o.cache.items) {
            if (now > self.o.cache.items[i].create + self.o.cache.tll) {
                self.o.cache.items.splice(i, 1);
            }
        }
    };

    // setparams method
    Paginator.prototype.setParams = function(options, autoload) {
        var self = this;

        if (typeof options == 'object') {
            for (var i in options) {
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
        if (typeof self.o.callbacks[name] == 'function')
            self.o.callbacks[name](data);
    };

    // return parsed url, e.g http://mysite.com/?p1=value1&p2=value2
    // returned ['http://mysite.com/', {p1:value1, p2:value2}]
    function _parseUrl(url) {
        if (!url) return;

        var result = [];
        result.push(url.split('?')[0] || url);
        result.push($.parseParams(url.split('?')[1] || ''));
        return result;
    }

    $.fn.pjax = function(options) {
        var args = Array.prototype.slice.call(arguments, 1);
        return this.each(function() {
            var $this = $(this),
                data = $this.data('pjax');
            if (!data) {
                var settings = $.extend(true, {}, Paginator.default, $this.data(), typeof options == 'object' && options);
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
(function($) {
    $.findByKey = function(array, find) {
        var result = [];
        array.forEach(function(object, index) {
            for (var key in find) {
                var value = find[key];
                key = key.split('.');
                var temp = (JSON.parse(JSON.stringify(object)));
                key.forEach(function(keyv, keyi) {
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
            query = query.replace('amp;', '').replace('amp%3B', '').replace('&%3B', '&');
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
