/**
 * ElasticSearch Implementation
 *
 * @author korotkov@ud
 */
(function( $ ) {

  /**
   * ElasticSeach
   *
   * @param {type} settings
   * @returns {@this;|_L6.$.fn.ddpElasticSuggest}
   */
  $.fn.elasticSearch = function( settings ) {

    var

      /**
       * Reference to this
       * @type @this;
       */
      self = this,

      /**
       * Defaults
       * @type object
       */
      options = $.extend({
        debug: false,
        timeout: 30000
      }, settings ),

      /**
       * Debug functions
       * @type type
       */
      _console = {

        /**
         * Log
         *
         * @param {type} a
         * @param {type} b
         */
        log: function( a, b ) {
          if ( typeof console === 'object' && options.debug ) {
            console.log( a, b );
          }
        },

        /**
         * Debug
         *
         * @param {type} a
         * @param {type} b
         */
        debug: function( a, b ) {
          if ( typeof console === 'object' && options.debug ) {
            console.debug( a, b );
          }
        },

        /**
         * Error
         *
         * @param {type} a
         * @param {type} b
         */
        error: function( a, b ) {
          if ( typeof console === 'object' && options.debug ) {
            console.error( a, b );
          }
        }
      },

      /**
       * Global viewmodel
       *
       * @type function
       */
      viewModel = function() {

        /**
         * Reference to this
         * @type @this;
         */
        var self = this;

        /**
         * Autocompletion Object
         */
        this.autocompletion = {

          /**
           * Documents Collection
           */
          documents: ko.observableArray( [] ),

          /**
           * Types
           */
          types: ko.observable( {} ),

          /**
           * Visibility flag
           */
          loading: ko.observable( false )
        };

        /**
         * Autocompletion docs count
         */
        this.autocompletion.count = ko.computed(function() {
            return self.autocompletion.documents().length;
        });

        /**
         *
         */
        this.autocompletion.visible = ko.computed(function() {
            return self.autocompletion.documents().length && !self.autocompletion.loading();
        });

        /**
         * Filter Object
         */
        this.filter = {

          /**
           * Filtered documents collection
           */
          documents: ko.observableArray([]),

          /**
           * Total filtered documents
           */
          total: ko.observable(0),

          /**
           * Filter facets collection
           */
          facets: ko.observableArray([]),

          /**
           * More button docs count
           */
          moreCount: ko.observable(0),

          /**
           * Human facet labels
           */
          facetLabels: ko.observable({})
        };

        /**
         * Filtered docs count
         */
        this.filter.count = ko.computed(function() {
          return self.filter.documents().length;
        });

        /**
         * Determine whether filter has more documents to show oe not
         */
        this.filter.has_more_documents = ko.computed(function() {
          return self.filter.total() > self.filter.count();
        });

      },

      /**
       * Knockout custom bindings
       * @type Object
       */
      bindings = {

        /**
         * Suggester for sitewide search
         */
        elasticSuggest: {

          /**
           * Default settings
           */
          settings: {

            /**
             * Minimum number of chars to start search for
             */
            min_chars: 3,

            /**
             * Fields to return
             */
            return_fields: [
              'post_title',
              'permalink'
            ],

            /**
             * Fields to search on
             */
            search_fields: ['post_title'],

            /**
             * Typing timeout
             */
            timeout: 100,

            /**
             * Doc types to search in
             */
            document_type: {
              unknown:'Unknown'
            },

            /**
             * Default search direction
             */
            sort_dir:'asc',

            /**
             * Default request size
             */
            size:20,

            /**
             * Autocompletion form selector
             */
            selector:'#autocompletion',

            /**
             * Ability to change query before execution
             */
            custom_query: {}
          },

          /**
           * Container for setTimeout reference
           */
          timeout: null,

          /**
           * Build query
           */
          buildQuery: function( query_string ) {

            /**
             * Validate
             */
            if ( !query_string || !query_string.length ) {
              _console.error( 'Wrong query string', query_string );
            }

            /**
             * Validate
             */
            if ( !this.settings.search_fields ) {
              _console.error( 'Autocompletion fields are empty', this.settings.search_fields );
            }

            /**
             * Return query object with the ability to extend or change it
             */
            return $.extend({
              query:{
                multi_match:{
                  operator: "and",
                  query: query_string,
                  fields: this.settings.search_fields
                }
              },
              fields: this.settings.return_fields,
              sort: {
                _type: {
                  order: this.settings.sort_dir
                }
              },
              size: this.settings.size
            }, this.settings.custom_query );
          },

          /**
           * Autocomplete submit function
           */
          submit: function( viewModel, element ) {
            _console.log( 'Typing search input', arguments );

            /**
             * Stop submitting if already ran
             */
            if ( this.timeout ) {
              window.clearTimeout( this.timeout );
            }

            /**
             * Do nothing if not enough chars typed
             */
            if ( element.val().length < this.settings.min_chars ) {
              viewModel.autocompletion.loading(false);
              viewModel.autocompletion.documents([]);
              return true;
            }

            _console.log( 'Search fired for ', element.val() );

            /**
             * Run search query with timeout
             */
            viewModel.autocompletion.loading(true);
            this.timeout = window.setTimeout(
              /**
               * API method
               */
              api.search,

              /**
               * Typing timeout
               */
              this.settings.timeout,

              /**
               * Build and pass query
               */
              this.buildQuery( element.val() ),

              /**
               * Types
               */
              Object.keys(this.settings.document_type),

              /**
               * Success handler
               *
               * @param {type} data
               * @param {type} xhr
               */
              function( data, xhr ) {
                _console.debug( 'Autocompletion Search Success', arguments );
                viewModel.autocompletion.documents( data.hits.hits );
                viewModel.autocompletion.loading(false);
              },

              /**
               * Error handler
               */
              function() {
                _console.error( 'Autocompletion Search Error', arguments );
                viewModel.autocompletion.loading(false);
              }
            );
          },

          /**
           * Suggester Initialization
           */
          init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            _console.debug( 'elasticSuggest init', arguments );

            var
              /**
               * Suggest binding object to work with
               */
              Suggest = bindings.elasticSuggest;

            /**
             * Apply settings passed
             */
            Suggest.settings = $.extend( Suggest.settings, valueAccessor() );

            /**
             * Set types
             */
            viewModel.autocompletion.types( Suggest.settings.document_type );

            /**
             * Fire autocomplete function on input typing
             */
            $(element).on('keyup', function(){
              Suggest.submit( viewModel, $(this) );
            });

            /**
             * Prevent form submitting on Enter key
             */
            $(element).keypress(function(e) {
              var code = e.keyCode || e.which;
              if(code == 13)
                return false;
            });

            /**
             * Control dropdown visibility
             */
            $('html').on('click', function(){
              viewModel.autocompletion.documents([]);
            });
            $(Suggest.settings.selector).on('click', function(e){
              e.stopPropagation();
            });
          }

        },

        /**
         * Regular filter binding
         */
        elasticFilter: {

          /**
           * Filter defaults
           */
          settings: {

            /**
             * Default period direction
             */
            period: 'upcoming',

            /**
             * Default field that is responsible for date filtering
             */
            period_field: 'date',

            /**
             * Default sort option
             */
            sort_by: 'date',

            /**
             * Default sorting direction
             */
            sort_dir: 'asc',

            /**
             * Default number of document per page
             */
            per_page: 20,

            /**
             * Offset number
             */
            offset: 0,

            /**
             * Bool flag for more button
             */
            is_more: false,

            /**
             * Facets set
             */
            facets: {},

            /**
             * Default type
             */
            type: 'unknown',

            /**
             * Fields to return
             */
            return_fields: null,

            /**
             * Ability to query before execution
             */
            custom_query: {}
          },

          /**
           * Store initial value of per page
           */
          initial_per_page: 20,

          /**
           * Store current filter options to use after re-rendering
           */
          current_filters: null,

          /**
           * DOM Element of filter form
           */
          form: null,

          /**
           * Loading indicator
           */
          loader: null,

          /**
           * DSL Query builder function
           * @return DSL object that should be passed as query argument to ElasticSearch
           */
          buildQuery: function() {

            /**
             * Get form filter data
             */
            this.current_filters = this.form.serializeObject();

            /**
             * Clean object from empty/null values
             */
            cleanObject( this.current_filters );

            _console.log('Current filter data:', this.current_filters);

            /**
             * Start building the Query
             */
            var filter = {
              bool: {
                must: []
              }
            };

            /**
             * Determine filter period
             */
            if ( this.settings.period ) {

              var period = { range: {} };

              switch( this.settings.period ) {

                case 'upcoming':

                  period.range[this.settings.period_field] = {
                     gte:'now'
                  };

                  filter['bool']['must'].push( period );

                  break;

                case 'past':

                  period.range[this.settings.period_field] = {
                     lte:'now'
                  };

                  filter['bool']['must'].push( period );

                  break;

                default: break;
              }
            }

            /**
             * Determine date range if is set
             * @todo: maybe need to add 'date_range' as an option to be able to customize <input name="date_range[lte/gte]">
             */
            if ( !$.isEmptyObject( this.current_filters.date_range ) ) {
              var range = { range: {} };
              range.range[this.settings.period_field] = this.current_filters.date_range;
              filter['bool']['must'].push( range );
            }

            /**
             * Build filter terms based on filter form
             * @todo: maybe need to add 'terms' as an option to be able to customize <select name="terms[]">
             */
            if ( this.current_filters.terms ) {
              $.each( this.current_filters.terms, function(key, value) {
                if ( value !== "0" ) {
                  var _term = {};
                  _term[key] = value;
                  filter['bool']['must'].push({
                    term: _term
                  });
                }
              });
            }

            /**
             * Build facets
             * @todo: maybe need to add 'size' as an option to be able to control terms count to return
             */
            var facets = {};
            $.each( this.settings.facets, function( field, _ /* not used here */ ) {
              facets[field] = {
                terms: { field: field, size: 100 }
              };
            });

            /**
             * Build sort option
             * @todo: force geo location if no point set in cookies
             * @todo: get rid hardcoded 'hdp_event_date'
             */
            var sort = [];
            if ( this.settings.sort_by ) {

              var sort_type = {};

              switch( this.settings.sort_by ) {
                case 'distance':
                  var lat = Number($.cookie('latitude'))?Number($.cookie('latitude')):0;
                  var lon = Number($.cookie('longitude'))?Number($.cookie('longitude')):0;
                  sort.push({
                    _geo_distance: {
                      location: [
                        lat, lon
                      ],
                      order: this.settings.sort_dir
                    }
                  });
                  break;
                default:
                  sort_type[this.settings.sort_by] = {
                    order: this.settings.sort_dir
                  };
                  sort.push(sort_type);
                  break;
              }
            }

            /**
             * Return ready DSL object
             */
            return $.extend({
              size: this.settings.per_page,
              from: this.settings.offset,
              query: {
                filtered: {
                  filter: filter
                }
              },
              fields: this.settings.return_fields,
              facets: facets,
              sort: sort
            }, this.settings.custom_query );
          },

          /**
           * Submit filter request
           */
          submit: function( viewModel ) {

            /**
             * Reference to this
             * @type @this;
             */
            var self = this;

            /**
             * Show loader indicator
             */
            this.loader.show();

            /**
             * Run search request
             */
            api.search(

              /**
               * Build and pass DSL Query
               */
              this.buildQuery(),

              /**
               * Documents type
               */
              this.settings.type,

              /**
               * Search success handler
               *
               * @param {type} data
               * @param {type} xhr
               */
              function( data, xhr ) {
                _console.log('Filter Success', arguments);

                /**
                 * If is a result of More request then append hits to existing.
                 * Otherwise just replace.
                 */
                if ( self.settings.is_more ) {
                  var current_hits = viewModel.filter.documents();

                  $.each( data.hits.hits, function(k, hit) {
                    current_hits.push( hit );
                  });

                  viewModel.filter.documents( current_hits );
                } else {
                  viewModel.filter.documents( data.hits.hits );
                }

                /**
                 * Store total
                 */
                viewModel.filter.total( data.hits.total );

                /**
                 * Update facets
                 */
                viewModel.filter.facets([]);
                $.each( data.facets, function( key, value ) {
                  value.key = key;
                  viewModel.filter.facets.push(value);
                });

                /**
                 * Hide loader indicator
                 */
                self.loader.hide();

                /**
                 * Trigger custom event on success
                 */
                $(document).trigger( 'elasticFilter.submit.success', arguments );
              },

              /**
               * Error Handler
               */
              function() {
                _console.error('Filter Error', arguments);
                self.loader.hide();
              }
            );

          },

          /**
           * Flush filter settings
           */
          flushSettings: function() {
            this.settings.is_more  = false;
            this.settings.offset   = 0;
            this.settings.per_page = this.initial_per_page;
          },

          /**
           * Initialize elasticFilter binding
           */
          init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            _console.debug( 'elasticFilterFacets init', arguments );

            /**
             * Create DOM for loading indicator
             * @todo: should not be so hardcoded
             */
            $('body').append('<style>.df_overlay_back{z-index:99999;background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyBpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBXaW5kb3dzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjE5RDU5NzY3RjJENzExRTJCMUJBRTdCMDBDNjdDOUFGIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjE5RDU5NzY4RjJENzExRTJCMUJBRTdCMDBDNjdDOUFGIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6MTlENTk3NjVGMkQ3MTFFMkIxQkFFN0IwMEM2N0M5QUYiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6MTlENTk3NjZGMkQ3MTFFMkIxQkFFN0IwMEM2N0M5QUYiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4ztIVWAAAAD0lEQVR42mJgYGBoAAgwAACFAIHr1UyZAAAAAElFTkSuQmCC);}.df_overlay{z-index:999999;background-image: url(data:image/gif;base64,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);background-position:50% 50%;background-repeat:no-repeat;}.df_overlay,.df_overlay_back{display:none;position:fixed;top:0;bottom:0;left:0;right:0;}</style><div class="df_overlay_back"></div><div class="df_overlay"></div>');

            var
              /**
               * Filter object to work with
               */
              Filter  = bindings.elasticFilter,

              /**
               * Filter form
               */
              form    = $( element ),

              /**
               * Filter controls
               */
              filters = $( 'input,select', form );

            /**
             * Define settings
             */
            Filter.settings         = $.extend( Filter.settings, valueAccessor() );
            Filter.loader           = $('.df_overlay_back,.df_overlay');
            Filter.form             = form;
            Filter.initial_per_page = Filter.settings.per_page;
            viewModel.filter.facetLabels( Filter.settings.facets );

            /**
             * @todo: This needs to be moved out from library
             */
            $(document).on('elasticFilter.submit.success', function() {
              $( '.hdp_event_collapsed, .hdp_event_expanded' ).unbind('click');
              $( '.hdp_event_collapsed, .hdp_event_expanded' ).on('click', function() {
                $( '.hdp_event_expanded:visible' ).hide();
                $( '.hdp_event_collapsed' ).not( ':visible' ).show();
                $( this ).toggle().siblings( '.hdp_event_collapsed, .hdp_event_expanded' ).toggle();
              });
              if ( Filter.current_filters && Filter.current_filters.terms ) {
                $.each( Filter.current_filters.terms, function(key, value) {
                  $( '[name="terms['+key+']"]', form ).val( value );
                });
              }
              form.removeClass('jqtransformdone').jqTransform();
            });

            _console.log( 'Current Filter settings', Filter.settings );

            /**
             * Bind change event
             */
            filters.live('change', function(){
              Filter.flushSettings();
              Filter.submit( viewModel );
            });

            /**
             * Initial filter submit
             */
            Filter.submit( viewModel );
          }

        },

        /**
         * Elastic filter sorting controls binding
         */
        elasticSortControl: {

          /**
           * Default settings
           */
          settings: {
            button_class:'df_element',
            active_button_class:'df_sortable_active'
          },

          /**
           * Initialize current binding
           */
          init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            _console.log( 'elasticSortControl Init', arguments );

            var
              /**
               * Filter object to work with
               */
              Filter = bindings.elasticFilter,

              /**
               * Reference to tis sorter object
               */
              Sorter = bindings.elasticSortControl;

            /**
             * Set settings
             */
            Sorter.settings = $.extend( Sorter.settings, valueAccessor() );

            /**
             * Bind buttons events
             */
            var buttons = $('.'+Sorter.settings.button_class, element);
            $(document).on('elasticFilter.submit.success', function() {
              buttons.unbind('click');
              buttons.on('click', function() {
                buttons.removeClass(Sorter.settings.active_button_class);
                $(this).addClass(Sorter.settings.active_button_class);
                $(this).attr('sort_direction', Filter.settings.sort_dir==='asc'?'desc':'asc');
                Filter.flushSettings();
                Filter.settings.sort_by = $(this).attr('attribute_key');
                Filter.settings.sort_dir = $(this).attr('sort_direction');
                Filter.submit( viewModel );
              });
            });
          }
        },

        /**
         * Elastic filter time control binding
         */
        elasticTimeControl: {

          /**
           * Default settings
           */
          settings: {
            button_class:'df_element',
            active_button_class:'df_sortable_active'
          },

          /**
           * Initialize current binding
           */
          init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            _console.log( 'elasticTimeControl Init', arguments );

            var
              /**
               * Filter object to work with
               */
              Filter = bindings.elasticFilter,

              /**
               * Time controll object
               */
              Time = bindings.elasticTimeControl;

            /**
             * Set settings
             */
            Time.settings = $.extend( Time.settings, valueAccessor() );

            /**
             * Bind button events
             */
            var buttons = $('.'+Time.settings.button_class, element);
            $(document).on('elasticFilter.submit.success', function(){
              buttons.unbind('click');
              buttons.on('click', function(){
                buttons.removeClass(Time.settings.active_button_class);
                $(this).addClass(Time.settings.active_button_class);
                Filter.flushSettings();
                Filter.settings.period = $(this).attr('_filter');
                Filter.submit( viewModel );
              });
            });
          }
        },

        /**
         * Show More button binding
         */
        filterShowMoreControl: {

          /**
           * Default settings
           */
          settings: {
            count: 10
          },

          /**
           * Initialize current binding
           */
          init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            _console.log( 'filterShowMoreControl init', arguments );

            var
              /**
               * Show more object
               */
              ShowMore = bindings.filterShowMoreControl,

              /**
               * Filter object
               */
              Filter = bindings.elasticFilter;

            /**
             * Set settings
             */
            ShowMore.settings = $.extend( ShowMore.settings, valueAccessor() );
            viewModel.filter.moreCount( ShowMore.settings.count );

            /**
             * Bind button events
             */
            $(element).on('click', function(){
              Filter.settings.per_page = ShowMore.settings.count;
              Filter.settings.offset   = viewModel.filter.count();
              Filter.settings.is_more  = true;
              Filter.submit( viewModel );
            });
          }
        },

        /**
         * Foreach for Object
         */
        foreachprop: {

          /**
           * Transform object to array
           * @param {type} obj
           * @returns {Array}
           */
          transformObject: function (obj) {
              var properties = [];
              for (var key in obj) {
                  if (obj.hasOwnProperty(key)) {
                      properties.push({ key: key, value: obj[key] });
                  }
              }
              return properties;
          },

          /**
           * Initialize binding
           */
          init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            var value = ko.utils.unwrapObservable(valueAccessor()),
            properties = ko.bindingHandlers.foreachprop.transformObject(value);
            ko.applyBindingsToNode(element, { foreach: properties }, bindingContext);
            return { controlsDescendantBindings: true };
          }
        }

      },

      /**
       * HTTP Client
       * @type object
       */
      client = null,

      /**
       * The API. Currently does search only
       * @type type
       */
      api = {

        /**
         * Do Search request
         * @param {type} query
         * @param {type} type
         * @param {type} success
         * @param {type} error
         */
        search: function( query, type, success, error ) {
          _console.log( 'API Search', arguments );

          if ( !type ) {
            type = '';
          }

          if ( client )
            client.post( 'documents/'+type+'/search', JSON.stringify( query ), success, error );
          else _console.error( 'API Search Error', 'Client is undefined' );
        }

      },

      /**
       * Init Client and Apply Bindings
       * @returns {_L6.$.fn.ddpElasticSuggest}
       */
      init = function() {
        _console.debug( 'Plugin init', {self:self, options:options});

        /**
         * Needs KO
         */
        if ( typeof ko === 'undefined' ) {
          _console.error( typeof ko, 'Knockout.js is required.' );
        }

        /**
         * Needs HTTP client
         */
        if ( typeof ejs.HttpClient === 'undefined' ) {
          _console.error( typeof ejs.HttpClient, 'HttpClient is required.' );
        }

        /**
         * Register bindings
         */
        for( var i in bindings ) {
          ko.bindingHandlers[i] = bindings[i];
        }
        _console.debug( 'Bindings registered', ko.bindingHandlers );

        /**
         * Init Client
         */
        client = ejs.HttpClient( options.endpoint );
        if ( options.access_key ) {
          client.addHeader( 'x-access-key', options.access_key );
        }
        _console.debug( 'Client init', client );

        /**
         * Apply view model
         */
        ko.applyBindings( new viewModel(), self[0] );

        return self;
      };

    return init();

  };

  /**
   * Form Serialize Object
   */
  $.fn.serializeObject = function() {
    var self = this,
        json = {},
        push_counters = {},
        patterns = {
          "validate": /^[a-zA-Z][a-zA-Z0-9_]*(?:\[(?:\d*|[a-zA-Z0-9_]+)\])*$/,
          "key": /[a-zA-Z0-9_]+|(?=\[\])/g,
          "push": /^$/,
          "fixed": /^\d+$/,
          "named": /^[a-zA-Z0-9_]+$/
        };

    this.build = function(base, key, value) {
      base[key] = value;
      return base;
    };

    this.push_counter = function(key) {
      if (push_counters[key] === undefined) {
        push_counters[key] = 0;
      }
      return push_counters[key]++;
    };

    $.each($(this).serializeArray(), function() {

      if (!patterns.validate.test(this.name)) {
        return;
      }

      var k,
          keys = this.name.match(patterns.key),
          merge = this.value,
          reverse_key = this.name;

      while ((k = keys.pop()) !== undefined) {

        reverse_key = reverse_key.replace(new RegExp("\\[" + k + "\\]$"), '');

        if (k.match(patterns.push)) {
          merge = self.build([], self.push_counter(reverse_key), merge);
        }

        else if (k.match(patterns.fixed)) {
          merge = self.build([], k, merge);
        }

        else if (k.match(patterns.named)) {
          merge = self.build({}, k, merge);
        }
      }

      json = $.extend(true, json, merge);
    });

    return json;
  };

  /**
   * Clean object from empty values
   * @param {type} target
   * @returns {unresolved}
   */
  var cleanObject = function ( target ) {
    Object.keys( target ).map( function ( key ) {
      if ( target[ key ] instanceof Object ) {
        if ( ! Object.keys( target[ key ] ).length && typeof target[ key ].getMonth !== 'function') {
          delete target[ key ];
        }
        else {
          cleanObject( target[ key ] );
        }
      }
      else if ( target[ key ] === "" || target[ key ] === null ) {
        delete target[ key ];
      }
    } );
    return target;
  };

})(jQuery);