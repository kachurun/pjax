'use strict';

(function () {
    $(function () {
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
                afterLoad: function afterLoad(obj) {
                    console.log(obj);
                },
                onError: function onError(err) {
                    // console.log(err);
                }
            }
        });
    });
})();