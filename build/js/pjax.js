'use strict';

(function ($) {
    var Paginator = function Paginator(container, options) {
        this.container = container;
        this.url = '';

        this.o = {};
        this.o.pagination = options.pagination;
        this.o.lazyLoad = options.lazyLoad;
        this.o.lazyContainer = options.lazyContainer;
        this.o.lazyDynamic = options.lazyDynamic;
        this.o.lazyDynamicTimeout = options.lazyDynamicTimeout;
        this.o.lazyDynamicDelayedStart = options.lazyDynamicDelayedStart;
        this.o.query = options.query;
        this.o.params = options.params;
        this.o.specialParams = options.specialParams;
        this.o.method = options.method;
        this.o.cache = options.cache || {};
        this.o.callbacks = options.callbacks;

        this.fromCache = false;
        this.pageLoad = false; // key for fix safari bug with popstate fire on page load

        this.init();
    };

    // init function
    Paginator.prototype.init = function (reinit) {
        var _this = this;

        // events on pagination
        this.eventHandle(true);

        // if query was set, preload page via ajax
        if (this.o.query) {
            this.ajaxLoad(this.container);
        }

        //cacheControl
        setInterval(function () {
            _this.cacheControl();
        }, 1000);
    };

    // pagination events
    Paginator.prototype.eventHandle = function (gl) {
        var _this2 = this;

        // global events
        if (gl) {
            // popstate changed. Run at forward\backward action
            $(window).off('popstate.pjax').on('popstate.pjax', function () {
                _this2.url = location.pathname + location.search;
                _this2.o.query = location.pathname;
                _this2.o.params = $.parseParams(location.search.split('?')[1] || '');

                // load page content
                if (_this2.pageLoad) {
                    _this2.ajaxLoad(_this2.container, true);
                }
            });

            // on page scroll. if lazyDynamic true
            if (this.o.lazyDynamic && !this.o.lazyDynamicDelayedStart) {
                $(window).off('scroll.pjax').on('scroll.pjax', function () {
                    var $lazyLoad = $(_this2.o.lazyLoad);
                    if (!$lazyLoad[0]) return false;

                    // set a timeout after which simulate a click on the lazyLoad button
                    clearTimeout($lazyLoad.data('timeout'));
                    var timer = setTimeout(function () {
                        var anchor = void 0;
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
                    }, _this2.o.lazyDynamicTimeout);
                    $lazyLoad.data('timeout', timer);
                });
                // trigger scroll event on page load
                $(window).trigger('scroll.pjax');
            }
        }

        // pagination keys
        if (this.o.pagination) {
            $(this.o.pagination).off('click.pjax').on('click.pjax', function (e) {
                e.preventDefault();

                // set query and params for request
                _this2.url = $(e.currentTarget).attr('href');
                var paramsData = _parseUrl(_this2.url);
                if (paramsData) {
                    _this2.o.query = paramsData[0];
                    _this2.o.params = paramsData[1];
                }

                // ajax page load
                _this2.ajaxLoad(_this2.container);
            });
        }

        // paginations lazy load button
        if (this.o.lazyLoad && this.o.lazyContainer) {
            $(this.o.lazyLoad).off('click.pjax').on('click.pjax', function (e) {
                e.preventDefault();
                // prevent lazyload on timeout after click
                clearTimeout($(_this2.o.lazyLoad).data('timeout'));

                // set query and params for request
                _this2.url = $(e.currentTarget).attr('href');
                if (!_this2.url) return;

                _this2.o.query = _parseUrl(_this2.url)[0];
                _this2.o.params = _parseUrl(_this2.url)[1];

                // ajax page load.
                // lazy flag on
                _this2.isLazy = true;
                _this2.ajaxLoad(_this2.o.lazyContainer);

                if (_this2.o.lazyDynamicDelayedStart) {
                    _this2.o.lazyDynamicDelayedStart = false;
                    _this2.eventHandle();
                }
            });
        }
    };

    // load page via ajax
    Paginator.prototype.ajaxLoad = function (container, nohistory) {
        var _this3 = this;

        // prevent many requests
        if (this.inLoading) return;

        var history = !nohistory;
        var params = $.extend({}, this.o.params, this.o.specialParams);
        var cache_id = this.o.query + '_' + $.param(params);
        var cache_index = $.findByKey(this.o.cache.items, {
            id: cache_id
        });

        // page loaded (safari bug fix)
        this.pageLoad = true;
        this.inLoading = true;

        // beforeLoad callback
        this.callback('beforeLoad', this);

        // find it in cache first and load
        if (this.o.cache.enabled && cache_index) {
            this.fromCache = true;
            // insert into or replace with container
            if (this.isLazy) {
                // insert instead container
                $(container).replaceWith(this.o.cache.items[cache_index].data);
            } else {
                // insert into container
                $(container).html(this.o.cache.items[cache_index].data);
            }
            // update events
            this.eventHandle();

            // afterLoad callback
            this.callback('afterLoad', $.extend({}, this));

            // set history
            if (history) this.historyAdd();

            this.inLoading = false;
            return;
        }

        // MOCK
        // setTimeout(function () {
        //     let data = [
        //                 '<div class="pagination-container">',
        //                     '<a href="/ajax/page2.html?page=2" class="button load-more">More...</a>',
        //                 '</div>'];
        //
        //     for (let i = 0, len = 2; i < len; i++) {
        //         data.unshift(['<div class="item">',
        //             '<div class="item-header">Item header ', i ,' </div>',
        //             '<div class="item-content">Item content</div>',
        //         '</div>'].join(''));
        //     }
        //     data = data.join('');
        //
        //     if (this.isLazy) {
        //         // insert instead container
        //         $(container).replaceWith(data);
        //     } else {
        //         // insert into container
        //         $(container).html(data);
        //     }
        //
        //     // update events
        //     this.eventHandle();
        //
        //     this.inLoading = false;
        // }, 300);
        // return;

        $.ajax({
            method: this.o.method,
            url: this.o.query,
            data: params,
            dataType: 'html'
        }).done(function (data) {
            if (data) {
                _this3.fromCache = false;
                // add to cache element
                if (_this3.o.cache.enabled) {
                    _this3.o.cache.items.push({
                        create: Math.floor(new Date().getTime() / 1000),
                        id: cache_id,
                        data: data
                    });
                }

                if (_this3.isLazy) {
                    // insert instead container
                    $(container).replaceWith(data);
                } else {
                    // insert into container
                    $(container).html(data);
                }

                // update events
                _this3.eventHandle();

                // afterLoad callback
                _this3.callback('afterLoad', $.extend({}, _this3));

                // set history
                if (history) _this3.historyAdd();
            } else {
                // onError callback
                _this3.callback('onError', {
                    status: 'empty-response',
                    statusText: 'Empty Response from server'
                });
            }
            _this3.inLoading = false;
        }).fail(function (error) {
            // onError callback
            _this3.callback('onError', error);

            _this3.inLoading = false;
        });
    };

    // history add
    Paginator.prototype.historyAdd = function () {
        //html5 history api
        history.pushState(null, null, this.o.query + '?' + $.param(this.o.params));
        // lazy flag off
        this.isLazy = false;
    };

    // remove old cache
    Paginator.prototype.cacheControl = function () {
        var _this4 = this;

        var now = Math.floor(new Date().getTime() / 1000);

        this.o.cache.items.forEach(function (item, i) {
            if (now > item.create + _this4.o.cache.tll) {
                _this4.o.cache.items.splice(i, 1);
            }
        });
    };

    // setparams method
    Paginator.prototype.setParams = function (options) {
        this.o = $.extend({}, this.o, options);
        if (options && options.special_params) this.o.specialParams = options.special_params;
        this.init(true); //reinit
    };

    // callback
    Paginator.prototype.callback = function (name, data) {
        if (typeof this.o.callbacks[name] == 'function') this.o.callbacks[name](data);
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

    $.fn.pjax = function (options) {
        var args = Array.prototype.slice.call(arguments, 1);
        var defaults = {
            pagination: '',
            lazyLoad: null,
            lazyContainer: null,
            lazyDynamic: false,
            lazyDynamicTimeout: 500,
            lazyDynamicDelayedStart: false,
            query: '',
            params: {},
            specialParams: {},
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

        var $el = $(this).eq(0);
        var paginator = $el.data('pjax');

        if (!paginator) {
            var settings = $.extend(true, {}, defaults, options);
            if (options && options.special_params) settings.specialParams = options.special_params;
            paginator = new Paginator($el, settings);
            $el.data('pjax', paginator);
        } else {
            if (typeof paginator[options] === 'function') {
                paginator[options].apply(paginator, args);
            }
        }

        return paginator;
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
            var _loop = function _loop(_key) {
                var value = find[_key];
                _key = _key.split('.');
                var temp = JSON.parse(JSON.stringify(object));
                _key.forEach(function (keyv, keyi) {
                    if (keyv in temp) {
                        temp = temp[keyv];
                        if (_key.length - 1 === keyi && value == temp) {
                            result.push(index);
                        }
                    }
                });
                key = _key;
            };

            for (var key in find) {
                _loop(key);
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
(function ($) {
    var re = /([^&=]+)=?([^&]*)/g;
    var decodeRE = /\+/g; // Regex for replacing addition symbol with a space
    var decode = function decode(str) {
        return decodeURIComponent(str.replace(decodeRE, " "));
    };
    $.parseParams = function (query) {
        var params = {},
            e = void 0;
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