(function() {
    $(function() {
        let paginator = $('#container').pjax({
            pagination: '.pagination-container .pagination a',
            lazyLoad: '.load-more',
            lazyContainer: '.pagination-container',
            lazyDynamic: false,
            lazyDynamicTimeout: 500,
            special_params: {
                isAjax: true
            },
            cache: {
                enabled: false
            },
            callbacks: {
                afterLoad: function() {
                    paginator.setParams({ 'lazyDynamic': true });
                },
                onError: function() {
                    // console.log(err);
                }
            }
        });
    });
})();
