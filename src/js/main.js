(function() {
    $(function() {
        let lazyLoadEnabled = false; // ключ, что ленивая подгрузка не активна
        let paginator = $('#container').pjax({ // появился обьект paginator, можно к нему обращаться
            pagination: '.pagination-container .pagination a',
            lazyLoad: '.load-more',
            lazyContainer: '.pagination-container',
            lazyDynamic: false, // по умолчанию отключено
            lazyDynamicTimeout: 500, // настраиваем это заранее (можно и потом, но смысл)
            specialParams: { // special_params -> specialParams
                is_ajax: true
            },
            callbacks: {
                afterLoad: () => {
                    // если ленивая подгрузка еще не включена - включаем
                    if (!lazyLoadEnabled) {
                        paginator.setParams({ 'lazyDynamic': true });
                        lazyLoadEnabled = true;
                    }
                }
            }
        });
    });
})();
