(function(){
  $(function(){
    $('#container').pjax({
      pagination: '.pagination-container .pagination a',
      lazyLoad: '.load-more',
      lazyContainer: '.pagination-container',
      lazyDynamic: false,
      lazyDynamicTimeout: 3000,
      special_params: {
        isAjax: true
      },
      callbacks: {
        afterLoad: function(obj){
          console.log(obj);
        },
        onError: function(err){
          // console.log(err);
        }
      }
    });

  });
})();
