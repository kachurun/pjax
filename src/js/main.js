(function() {
    $(function() {
        // let lazyLoadEnabled = false;
        let paginator = $('#container').pjax({
            pagination: '.pagination-container .pagination a',
            lazyLoad: '.load-more',
            lazyContainer: '.pagination-container',
            lazyDynamic: true,
            lazyDynamicDelayedStart: true,
            lazyDynamicTimeout: 500,
            lazyDynamicOffset: -300,
            specialParams: {
                is_ajax: true
            },
            callbacks: {
                afterLoad: () => {
                    // если ленивая подгрузка еще не включена - включаем
                    // if (!lazyLoadEnabled) {
                    //     paginator.setParams({ 'lazyDynamic': true });
                    //     lazyLoadEnabled = true;
                    // }
                }
            }
        });
    });
})();
