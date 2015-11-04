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
