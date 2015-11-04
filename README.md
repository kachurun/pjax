# PJAX Loader
Использование:


    `$(container).pjax({
      pagination: '.pagination-container .pagination a',
      query: '',
      params: {},
      special_params: {},
      method: 'GET',
      cache: {
		enabled: true,
		tll: 60
	  },
      callbacks: {
        beforeLoad: function(data){ },
        afterLoad: null,
        onError: null
      }
    });`



----------


Обязательные парметры:
* container - элемент контейнера, содержимое которого будет изменяться
* pagination - элемент постранички, имеющий аттрибут href, обязателен т.к на него вешается событие click, обязательно должен иметь href
Не обязательные параметры:
* query - путь к серверу, если указать, то при инициализации плагина будет загружено содержимое с сервера ajax методом ( в противном случае предполагается что контент уже отрендерен на странице, например с помощью php)
* params - параметры запроса, в виде обьекта, {key1:value1, key2:value2} преобразуется к ?key1=value1&key2=value2
* special_params - специальные параметры, которые постоянно будут добавляться к запросу. Может использоваться для передачи на сервер информации о том что данные передаются через ajax.
* method - метод, по умолчанию GET.
* cache.enabled - включает или отключает кэширование страниц
*  cache.tll - устанавливает время жизни записи в кэшэ. Значение в секундах


----------


Коллбэки:
callbacks.beforeLoad - перед загрузкой данных. Первым аргументом получает обьект pjax со всеми свойствами.
callbacks.afterLoad - перед загрузкой данных. Аналогично beforeLoad
callbacks.onError - в случае серверной ошибки, когда код ответа != 2xx. Первый аргумент - обьект с ошибкой.


----------


Методы:

* Для изменения параметров после инициализации плагина:

`$(container).pjax('setParams', params, reload);`

Аргумент params - обьект с параметрами, обьект аналогичный параметрам плагина описаный выше.
Аргумент reload - логическое значение, указывает следует ли перезагружать контент при изменении параметров.
Пример использования:

  `$('#container').pjax('setParams', {
	    query: '/load_example_list',
	    params: {page: 3}
	}, true);`

   загрузит содержимое /load_example_list?page=3 в контейнер #container

* Получить сам pjax обьект можно так:

    `$('#container').data('pjax');`
