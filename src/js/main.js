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
