(function($) {
    let Paginator = function(container, options) {
        this.container = container;
        this.url = '';

        this.o = {};
        this.o.pagination = options.pagination;
        this.o.lazyLoad = options.lazyLoad;
        this.o.lazyContainer = options.lazyContainer;
        this.o.lazyDynamic = options.lazyDynamic;
        this.o.lazyDynamicTimeout = options.lazyDynamicTimeout;
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
    Paginator.prototype.init = function(reinit) {
        // events on pagination
        this.eventHandle(true);

        // if query was set, preload page via ajax
        if (this.o.query) {
            this.ajaxLoad(this.container);
        }

        //cacheControl
        setInterval(() => {
            this.cacheControl();
        }, 1000);
    };

    // pagination events
    Paginator.prototype.eventHandle = function(gl) {
        // global events
        if (gl) {
            // popstate changed. Run at forward\backward action
            $(window).off('popstate.pjax').on('popstate.pjax', () => {
                this.url = location.pathname + location.search;
                this.o.query = location.pathname;
                this.o.params = $.parseParams(location.search.split('?')[1] || '');

                // load page content
                if (this.pageLoad) {
                    this.ajaxLoad(this.container, true);
                }
            });

            // on page scroll. if lazyDynamic true
            if (this.o.lazyDynamic) {
                $(window).off('scroll.pjax').on('scroll.pjax', () => {
                    let $lazyLoad = $(this.o.lazyLoad);
                    if (!$lazyLoad[0]) return false;

                    // set a timeout after which simulate a click on the lazyLoad button
                    clearTimeout($lazyLoad.data('timeout'));
                    let timer = setTimeout(function() {
                        let anchor;
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
                    }, this.o.lazyDynamicTimeout);
                    $lazyLoad.data('timeout', timer);
                });
                // trigger scroll event on page load
                $(window).trigger('scroll.pjax');
            }
        }

        // pagination keys
        if (this.o.pagination) {
            $(this.o.pagination).on('click', e => {
                e.preventDefault();

                // set query and params for request
                this.url = $(e.currentTarget).attr('href');
                let paramsData = _parseUrl(this.url);
                if (paramsData) {
                    this.o.query = paramsData[0];
                    this.o.params = paramsData[1];
                }

                // ajax page load
                this.ajaxLoad(this.container);
            });
        }

        // paginations lazy load button
        if (this.o.lazyLoad && this.o.lazyContainer) {
            $(this.o.lazyLoad).on('click', e => {
                e.preventDefault();
                // prevent lazyload on timeout after click
                clearTimeout($(this.o.lazyLoad).data('timeout'));

                // set query and params for request
                this.url = $(e.currentTarget).attr('href');
                if (!this.url) return;

                this.o.query = _parseUrl(this.url)[0];
                this.o.params = _parseUrl(this.url)[1];

                // ajax page load.
                // lazy flag on
                this.isLazy = true;
                this.ajaxLoad(this.o.lazyContainer);
            });
        }
    };

    // load page via ajax
    Paginator.prototype.ajaxLoad = function(container, nohistory) {
        // prevent many requests
        if (this.inLoading) return;

        let history = !nohistory;
        let params = $.extend({}, this.o.params, this.o.special_params);
        let cache_id = this.o.query + '_' + $.param(params);
        let cache_index = $.findByKey(this.o.cache.items, {
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
            }
            else {
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
            dataType: 'html',
        })

        .done((data) => {
            if (data) {
                this.fromCache = false;
                // add to cache element
                if (this.o.cache.enabled) {
                    this.o.cache.items.push({
                        create: Math.floor(new Date().getTime() / 1000),
                        id: cache_id,
                        data: data
                    });
                }

                if (this.isLazy) {
                    // insert instead container
                    $(container).replaceWith(data);
                } else {
                    // insert into container
                    $(container).html(data);
                }

                // update events
                this.eventHandle();

                // afterLoad callback
                this.callback('afterLoad', $.extend({}, this));

                // set history
                if (history) this.historyAdd();
            }
            else {
                // onError callback
                this.callback('onError', {
                    status: 'empty-response',
                    statusText: 'Empty Response from server'
                });
            }
            this.inLoading = false;
        })

        .fail((error) => {
            // onError callback
            this.callback('onError', error);

            this.inLoading = false;
        });
    };

    // history add
    Paginator.prototype.historyAdd = function() {
        //html5 history api
        history.pushState(null, null, this.o.query + '?' + $.param(this.o.params));
        // lazy flag off
        this.isLazy = false;
    };

    // remove old cache
    Paginator.prototype.cacheControl = function() {
        let now = Math.floor(new Date().getTime() / 1000);

        this.o.cache.items.forEach((item, i) => {
            if (now > item.create + this.o.cache.tll) {
                this.o.cache.items.splice(i, 1);
            }
        });
    };

    // setparams method
    Paginator.prototype.setParams = function(options) {
        this.o = $.extend({}, this.o, options);
        if (options && options.special_params) this.o.specialParams = options.special_params;
        this.init(true); //reinit
    };

    // callback
    Paginator.prototype.callback = function(name, data) {
        if (typeof this.o.callbacks[name] == 'function') this.o.callbacks[name](data);
    };

    // return parsed url, e.g http://mysite.com/?p1=value1&p2=value2
    // returned ['http://mysite.com/', {p1:value1, p2:value2}]
    function _parseUrl(url) {
        if (!url) return;

        let result = [];
        result.push(url.split('?')[0] || url);
        result.push($.parseParams(url.split('?')[1] || ''));
        return result;
    }

    $.fn.pjax = function(options) {
        const args = Array.prototype.slice.call(arguments, 1);
        const defaults = {
            pagination: '',
            lazyLoad: null,
            lazyContainer: null,
            lazyDynamic: false,
            lazyDynamicTimeout: 500,
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

        const $el = $(this).eq(0);
        let paginator = $el.data('pjax');

        if (!paginator) {
            const settings = $.extend(true, {}, defaults, options);
            if (options && options.special_params) settings.specialParams = options.special_params;
            paginator = new Paginator($el, settings);
            $el.data('pjax', paginator);
        }
        else {
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
(function($) {
    $.findByKey = function(array, find) {
        let result = [];
        array.forEach(function(object, index) {
            for (let key in find) {
                let value = find[key];
                key = key.split('.');
                let temp = (JSON.parse(JSON.stringify(object)));
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
    let re = /([^&=]+)=?([^&]*)/g;
    let decodeRE = /\+/g; // Regex for replacing addition symbol with a space
    let decode = function(str) {
        return decodeURIComponent(str.replace(decodeRE, " "));
    };
    $.parseParams = function(query) {
        let params = {},
            e;
        if (typeof query === 'string') {
            query = query.replace('amp;', '').replace('amp%3B', '').replace('&%3B', '&');
        }

        while (e = re.exec(query)) {
            let k = decode(e[1]),
                v = decode(e[2]);
            if (k.substring(k.length - 2) === '[]') {
                k = k.substring(0, k.length - 2);
                (params[k] || (params[k] = [])).push(v);
            } else params[k] = v;
        }
        return params;
    };
})(jQuery);
