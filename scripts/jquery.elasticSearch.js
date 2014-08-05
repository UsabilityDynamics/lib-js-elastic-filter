/**
 * jQuery ElasticSearch Filter Implementation
 *
 * @version 3.0.2
 *
 * Copyright 2012 Usability Dynamics, Inc. (usabilitydynamics.com)
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL Alexandru Marasteanu BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/* jshint maxparams: 6 */
/* global ko */
/* global ejs */
/* jshint -W030 */

;(function( $ ) {

  "use strict";

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
       * @type function
       */
      ViewModel = function( scopes, suggesters ) {

        window.elasticSearchVM = this;

        /**
         * Autocompletion Object
         */
        this._suggester_model = function( scope ) {

          /**
           * Reference to this
           * @type @this;
           */
          var self = this;

          /**
           * Current scope
           */
          this.scope = scope;

          /**
           * Manual notifier
           */
          this._notify = ko.observable();

          /**
           * Documents Collection
           */
          this.documents = ko.observableArray( [] );

          /**
           * Types
           */
          this.types = ko.observable( {} );

          /**
           * Visibility flag
           */
          this.loading = ko.observable( false );

          /**
           * Autocompletion docs count
           */
          this.count = ko.computed(function() {
            return self.documents().length;
          });

          /**
           * Whether has text in input or not
           */
          this.has_text = ko.computed(function() {
            $('[data-suggest="'+self.scope+'"]').one('keyup', function(){
              self._notify.notifySubscribers();
            });
            self._notify();
            return typeof $('[data-suggest="'+self.scope+'"]').val() !== 'undefined' ? $('[data-suggest="'+self.scope+'"]').val().length : false;
          });

          /**
           * Autocompletion visibility
           */
          this.visible = ko.computed(function() {
            return self.has_text() && $('[data-suggest="'+self.scope+'"]').val().length >= (function() { return bindings.elasticSuggest[self.scope].min_chars; }());
          });

          /**
           * Clear search input
           */
          this.clear = function() {
            $('[data-suggest="'+self.scope+'"]').val('').keyup().change();
          };
        };

        /**
         * Filter instance exemplar
         * @param {type} scope
         */
        this._filter_model = function( scope ) {

          /**
           * Reference to this
           * @type @this;
           */
          var self = this;

          /**
           * Current scope
           */
          this.scope = scope;

          /**
           * Filtered documents collection
           */
          this.documents = ko.observableArray( [] );

          /**
           * Total filtered documents
           */
          this.total = ko.observable( 0 );

          /**
           * Filter facets collection
           */
          this.facets = ko.observableArray( [] );

          /**
           * More button docs count
           */
          this.moreCount = ko.observable( 0 );

          /**
           * Human facet labels
           */
          this.facetLabels = ko.observable( {} );

          /**
           * Filtered docs count
           */
          this.count = ko.computed(function() {
            return self.documents().length;
          });

          /**
           * Determine whether filter has more documents to show oe not
           */
          this.has_more_documents = ko.computed(function() {
            return self.total() > self.count();
          });
        };

        /**
         * Init by scopes
         */
        for ( var i in scopes ) {
          if ( scopes.hasOwnProperty(i) ) {
            this[scopes[i]] = new this._filter_model( scopes[i] );
          }
        }

        /**
         *
         * @type type
         */
        for ( var j in suggesters ) {
          if ( suggesters.hasOwnProperty(j) ) {
            this[suggesters[j]] = new this._suggester_model( suggesters[j] );
          }
        }

      },

      /**
       * Knockout custom bindings
       * @type Object
       */
      bindings = window.elasticSearchBindings = {

        /**
         * Suggester for sitewide search
         */
        elasticSuggest: {

          /**
           * Default settings
           */
          settings: function() {

            /**
             * Minimum number of chars to start search for
             */
            this.min_chars = 3;

            /**
             * Fields to return
             */
            this.return_fields = [
              'post_title',
              'permalink'
            ];

            /**
             * Typing timeout
             */
            this.timeout = 100;

            /**
             * Doc types to search in
             */
            this.document_type = {
              unknown:'Unknown'
            },

            /**
             * Default search direction
             */
            this.sort_dir = 'asc';

            /**
             * Default request size
             */
            this.size = 20;

            /**
             * Autocompletion form selector
             */
            this.selector = '#autocompletion';

            /**
             * Ability to change query before execution
             */
            this.custom_query = {};
          },

          /**
           * Container for setTimeout reference
           */
          timeout: null,

          /**
           * Build DSL query
           */
          buildQuery: function( query_string, scope ) {

            /**
             * Validate
             */
            if ( !query_string || !query_string.length ) {
              _console.error( 'Wrong query string', query_string );
            }

            var _query = {
              query: {
                filtered: {
                  query: {
                    match: {
                      _all: {
                        query: query_string,
                        operator: "and"
                      }
                    }
                  }
                }
              },
              fields: this[scope].return_fields,
              sort: {
                _type: {
                  order: this[scope].sort_dir
                }
              },
              size: this[scope].size
            };

            /**
             * Return query object with the ability to extend or change it
             */
            return $.extend( _query, this[scope].custom_query );
          },

          /**
           * Autocomplete submit function
           */
          submit: function( viewModel, element, scope ) {
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
            if ( element.val().length < this[scope].min_chars ) {
              viewModel[scope].loading(false);
              viewModel[scope].documents([]);
              return true;
            }

            _console.log( 'Search fired for ', element.val() );

            /**
             * Activate loading
             */
            viewModel[scope].loading(true);

            /**
             * Configure API
             */
            api.index( this[scope].index ).controllers( this[scope].controllers );

            /**
             * Run
             */
            this.timeout = window.setTimeout(

              /**
               * API method
               */
              api.search,

              /**
               * Typing timeout
               */
              this[scope].timeout,

              /**
               * Build and pass query
               */
              this.buildQuery( element.val(), scope ),

              /**
               * Types
               */
              Object.keys(this[scope].document_type),

              /**
               * Success handler
               *
               * @param {type} data
               * @param {type} xhr
               */
              function( data, xhr ) {
                _console.debug( 'Autocompletion Search Success', [data, xhr] );

                viewModel[scope].documents( data.hits.hits );
                viewModel[scope].loading(false);
              },

              /**
               * Error handler
               */
              function() {
                _console.error( 'Autocompletion Search Error', arguments );

                viewModel[scope].loading(false);
              },

              /**
               * Whether abort other requests or not
               */
              true
            );
          },

          /**
           * Suggester Initialization
           */
          init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            _console.debug( 'elasticSuggest init', [element, valueAccessor, allBindings, viewModel, bindingContext] );

            var
              /**
               * Suggest binding object to work with
               */
              Suggest = bindings.elasticSuggest,

              /**
               *
               * @type @exp;form@call;data
               */
              scope = $(element).data( 'suggest' );

            /**
             * Apply settings passed
             */
            Suggest[scope] = $.extend( new Suggest.settings(), valueAccessor() );

            /**
             * Set types
             */
            viewModel[scope].types( Suggest[scope].document_type );

            /**
             * Fire autocomplete function on input typing
             */
            $(element).on('keyup', function(){
              Suggest.submit( viewModel, $(this), scope );
            });

            /**
             * Prevent form submitting on Enter key
             */
            $(element).keypress(function(e) {
              var code = e.keyCode || e.which;
              if(code === 13) {
                return false;
              }
            });

            /**
             * Control dropdown visibility
             */
            $('html').on('click', function() {
              viewModel[scope].documents([]);
              $('[data-suggest="'+scope+'"]').val('').keyup().change();
            });
            $( Suggest[scope].selector ).on('click', function(e) {
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
          settings: function() {

            /**
             * Time point for present. Will be used for period filtering.
             */
            this.middle_timepoint = {
              gte: 'now',
              lte: 'now'
            };

            /**
             * Default period direction
             */
            this.period = 'upcoming';

            /**
             * Default field that is responsible for date filtering
             */
            this.period_field = 'date';

            /**
             * Default sort option
             */
            this.sort_by = 'date';

            /**
             * Default sorting direction
             */
            this.sort_dir = 'asc';

            /**
             * Default number of document per page
             */
            this.per_page = 20;

            /**
             * Offset number
             */
            this.offset = 0;

            /**
             * Bool flag for more button
             */
            this.is_more = false;

            /**
             * Facets set
             */
            this.facets = {};

            /**
             * Default type
             */
            this.type = 'unknown';

            /**
             * Fields to return
             */
            this.return_fields = null;

            /**
             * Ability to query before execution
             */
            this.custom_query = {};

            /**
             * Control location
             */
            this.location = false;

            /**
             * Configurable location field
             */
            this.location_field = 'location';

            /**
             * Facet size
             */
            this.facet_size = 100;

            /**
             * Facet input name base
             */
            this.facet_input = 'terms';

            /**
             * Date Range input name base
             */
            this.date_range_input = 'date_range';

            /**
             * Default loading indicator selector
             */
            this.loader_selector = '.df_overlay_back, .df_overlay';

            /**
             * Store initial value of per page
             */
            this.initial_per_page = 20;

            /**
             * Store current filter options to use after re-rendering
             */
            this.current_filters = null;

            /**
             * DOM Element of filter form
             */
            this.form = null;
          },

          /**
           * Loading indicator
           */
          loader: null,

          /**
           *
           * @param {type} scope
           */
          determinePeriod: function( scope ) {

            var period = { range: {} };

            switch( this[scope].period ) {

              case 'upcoming':

                period.range[this[scope].period_field] = {
                   gte:this[scope].middle_timepoint.gte
                };

                break;

              case 'past':

                period.range[this[scope].period_field] = {
                   lte:this[scope].middle_timepoint.lte
                };

                break;

              default: break;
            }

            return period;
          },

          /**
           *
           */
          determineDateRange: function( scope ) {
            var range = { range: {} };

            range.range[this[scope].period_field] = this[scope].current_filters[this[scope].date_range_input];

            return range;
          },

          /**
           *
           */
          buildSortOptions: function( scope ) {
            var sort_type = {};
            var _return;

            switch( this[scope].sort_by ) {

              case 'distance':

                var lat = Number( localStorage.getItem( 'elasticSearch_latitude' ) ) ? Number( localStorage.getItem( 'elasticSearch_latitude' ) ):0;
                var lon = Number( localStorage.getItem( 'elasticSearch_longitude' ) ) ? Number( localStorage.getItem( 'elasticSearch_longitude' ) ):0;

                var _geo_distance = {};
                _geo_distance[this[scope].location_field] = {
                  lat: lat, lon: lon
                };
                _geo_distance.order = this[scope].sort_dir;
                _geo_distance.unit = "m";

                _return = {
                  _geo_distance: _geo_distance
                };

                break;
              default:

                sort_type[this[scope].sort_by] = {
                  order: this[scope].sort_dir
                };

                _return = sort_type;

                break;
            }

            return _return;
          },

          /**
           * DSL Query builder function
           * @return DSL object that should be passed as query argument to ElasticSearch
           */
          buildQuery: function( scope ) {

            /**
             * Reference to this
             */
            var self = this;

            /**
             * Get form filter data
             */
            this[scope].current_filters = this[scope].form ? this[scope].form.serializeObject() : {};

            /**
             * Clean object from empty/null values
             */
            cleanObject( this[scope].current_filters );

            _console.log('Current filter data:', this[scope].current_filters);

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
            if ( this[scope].period ) {
              var period = this.determinePeriod( scope );
              filter.bool.must.push( period );
            }

            /**
             * Determine date range if is set
             */
            if ( !$.isEmptyObject( this[scope].current_filters[this[scope].date_range_input] ) ) {
              var range = this.determineDateRange( scope );
              filter.bool.must.push( range );
            }

            /**
             * Build filter terms based on filter form
             */
            if ( this[scope].current_filters[this[scope].facet_input] ) {
              $.each( this[scope].current_filters[this[scope].facet_input], function(key, value) {
                if ( value !== "0" ) {
                  var _term = {};
                  _term[key] = value;
                  filter.bool.must.push({
                    term: _term
                  });
                }
              });
            }

            /**
             * Build facets
             */
            var facets = {};
            $.each( this[scope].facets, function( field, val ) {
              _console.log( 'Facets foreach', [ field, val ] );
              facets[field] = {
                terms: { field: field, size: self[scope].facet_size }
              };
            });

            /**
             * Build sort option
             */
            var sort = [];
            if ( this[scope].sort_by ) {
              sort.push( this.buildSortOptions( scope ) );
            }

            /**
             * Return ready DSL object with the ability to extend it
             */
            return $.extend({
              size: this[scope].per_page,
              from: this[scope].offset,
              query: {
                filtered: {
                  filter: filter
                }
              },
              fields: this[scope].return_fields,
              facets: facets,
              sort: sort
            }, this[scope].custom_query );
          },

          /**
           * Submit filter request
           */
          submit: function( viewModel, scope ) {

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
            api
              .index( self[scope].index )
              .controllers( self[scope].controllers )
              .search(

              /**
               * Build and pass DSL Query
               */
              this.buildQuery( scope ),

              /**
               * Documents type
               */
              this[scope].type,

              /**
               * Search success handler
               *
               * @param {type} data
               * @param {type} xhr
               */
              function( data, xhr ) {
                _console.log('Filter Success', [ data, xhr ]);

                /**
                 * If is a result of More request then append hits to existing.
                 * Otherwise just replace.
                 */
                if ( self[scope].is_more ) {
                  var current_hits = viewModel.documents();

                  $.each( data.hits.hits, function(k, hit) {
                    current_hits.push( hit );
                  });

                  viewModel.documents( current_hits );
                } else {
                  viewModel.documents( data.hits.hits );
                }

                /**
                 * Store total
                 */
                viewModel.total( data.hits.total );

                /**
                 * Update facets when needed
                 */
                if ( typeof data.facets !== 'undefined' ) {

                  var _total = 0;
                  $.each( data.facets, function( key, value ) {
                    _total += value.total;
                  });

                  if ( _total ) {
                    viewModel.facets([]);
                    $.each( data.facets, function( key, value ) {
                      value.key = key;
                      viewModel.facets.push(value);
                    });
                  }
                }

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
              },

              /**
               * Whether abort other requests or not
               * @param {type} scope
               */
              false
            );

          },

          /**
           * Flush filter settings
           */
          flushSettings: function( scope ) {
            this[scope].is_more  = false;
            this[scope].offset   = 0;
            this[scope].per_page = this[scope].initial_per_page;
          },

          /**
           *
           * @param {type} Filter
           * @param {type} scope
           */
          determineCoords: function( Filter, scope, viewModel ) {
            /**
             * If no coords passed
             */
            if ( !Filter[scope].location ) {

              /**
               * If no coords in cookies
               */
              if ( ( !Number( localStorage.getItem( 'elasticSearch_latitude' ) ) || !Number( localStorage.getItem( 'elasticSearch_longitude' ) ) ) || localStorage.getItem( 'elasticSearch_geo_expire' ) < ( Math.round( Date.now()/1000 ) ) ) {

                /**
                 * If geo API exists
                 */
                if ( navigator.geolocation ) {

                  /**
                   * Get position
                   */
                  navigator.geolocation.getCurrentPosition(

                    /**
                     * Success handler
                     */
                    function( position ) {
                      _console.log( 'GeoLocation Success', arguments );

                      /**
                       * Remember coords
                       */
                      localStorage.setItem( 'elasticSearch_latitude', position.coords.latitude );
                      localStorage.setItem( 'elasticSearch_longitude', position.coords.longitude );
                      localStorage.setItem( 'elasticSearch_geo_expire', Math.round( Date.now()/1000 ) + 3600 );
                      
                      _console.log( 'localStorage - elasticSearch_latitude', localStorage.getItem('elasticSearch_latitude') );
                      _console.log( 'localStorage - elasticSearch_longitude', localStorage.getItem('elasticSearch_longitude') );
                      _console.log( 'localStorage - elasticSearch_geo_expire', localStorage.getItem('elasticSearch_geo_expire') );

                      /**
                       * Run filter again with new coords
                       */
                      Filter.submit( viewModel[scope], scope );
                    },

                    /**
                     * Error handler
                     */
                    function() {
                      _console.log( 'GeoLocation Erros', arguments );
                    },

                    /**
                     * Options
                     */
                    {enableHighAccuracy: true,maximumAge: 0}
                  );
                }
              }
            } else {
              /**
               * Remember passed coords
               */
              localStorage.setItem( 'elasticSearch_latitude', Filter[scope].location.latitude );
              localStorage.setItem( 'elasticSearch_longitude', Filter[scope].location.longitude );
              localStorage.setItem( 'elasticSearch_geo_expire', Math.round( Date.now()/1000 ) + 3600 );
              
              _console.log( 'localStorage - elasticSearch_latitude', localStorage.getItem('elasticSearch_latitude') );
              _console.log( 'localStorage - elasticSearch_longitude', localStorage.getItem('elasticSearch_longitude') );
              _console.log( 'localStorage - elasticSearch_geo_expire', localStorage.getItem('elasticSearch_geo_expire') );
            }
          },


          /**
           * Initialize elasticFilter binding
           * @param {type} element
           * @param {type} valueAccessor
           * @param {type} allBindings
           * @param {type} viewModel
           * @param {type} bindingContext
           * @returns {unresolved}
           */
          init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            _console.debug( 'elasticFilterFacets init', [ element, valueAccessor, allBindings, viewModel, bindingContext ] );

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
             * Define Scope
             */
            var scope = form.data( 'scope' );

            /**
             * Define settings
             */
            if ( typeof Filter[scope] === 'undefined' ) {
              Filter[scope] = {};
            }
            Filter[scope]                  = $.extend( new Filter.settings(), valueAccessor() );
            Filter.loader                  = $( Filter[scope].loader_selector );
            Filter[scope].form             = form;
            Filter[scope].initial_per_page = Filter[scope].per_page;
            viewModel[scope].facetLabels( Filter[scope].facets );

            /**
             *
             */
            Filter.determineCoords( Filter, scope, viewModel );

            /**
             * Render new facets
             */
            $(document).on('elasticFilter.submit.success', function() {
              if ( Filter[scope].current_filters && Filter[scope].current_filters.terms ) {
                $.each( Filter[scope].current_filters.terms, function(key, value) {
                  /**
                   * WOW! Closure!
                   */
                  $( '[name="'+(function(){return Filter[scope].facet_input;}).call(this)+'['+key+']"]', Filter[scope].form ).val( value );
                });
              }
              $(document).trigger( 'elasticFilter.facets.render', [Filter[scope].form] );
            });

            _console.log( 'Current Filter settings', Filter[scope] );

            /**
             * Bind change event
             */
            filters.live('change', function(){
              Filter.flushSettings( scope );
              Filter.submit( viewModel[scope], scope );
            });

            /**
             * Initial filter submit
             */
            Filter.submit( viewModel[scope], scope );
          }

        },

        /**
         * Elastic filter sorting controls binding
         */
        elasticSortControl: {

          /**
           * Default settings
           */
          settings: function() {

            /**
             * Button class selector
             */
            this.button_class = 'df_element';

            /**
             * Active button class
             */
            this.active_button_class = 'df_sortable_active';
          },

          /**
           * Initialize current binding
           */
          init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            _console.log( 'elasticSortControl Init', [ element, valueAccessor, allBindings, viewModel, bindingContext ] );

            var
              /**
               * Filter object to work with
               */
              Filter = bindings.elasticFilter,

              /**
               * Reference to tis sorter object
               */
              Sorter = bindings.elasticSortControl,

              /**
               * Current scope
               * Allows to use multiple filters on one page
               */
              scope = $(element).data('scope');

            /**
             * Set settings
             */
            Sorter[scope] = $.extend( new Sorter.settings(), valueAccessor() );

            /**
             * Bind buttons events
             */
            var buttons = $('.'+Sorter[scope].button_class, element);
            $(document).on('elasticFilter.submit.success', function() {

              buttons.unbind('click');

              buttons.on('click', function() {

                buttons.removeClass(Sorter[scope].active_button_class);
                $(this).addClass(Sorter[scope].active_button_class);

                var data = $(this).data();

                if ( !data.direction ) {
                  $(this).data('direction', Filter[scope].sort_dir);
                }

                $(this).data('direction', data.direction==='asc'?'desc':'asc');

                Filter.flushSettings( scope );
                Filter[scope].sort_by = data.type;
                Filter[scope].sort_dir = data.direction;
                Filter.submit( viewModel[scope], scope );
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
          settings: function() {

            /**
             * Button class selector
             */
            this.button_class = 'df_element';

            /**
             * Active button selector
             */
            this.active_button_class = 'df_sortable_active';
          },

          /**
           * Initialize current binding
           */
          init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            _console.log( 'elasticTimeControl Init', [ element, valueAccessor, allBindings, viewModel, bindingContext ] );

            var
              /**
               * Filter object to work with
               */
              Filter = bindings.elasticFilter,

              /**
               * Time controll object
               */
              Time = bindings.elasticTimeControl,

              /**
               * Current scope
               * Allows to use multiple filters on one page
               */
              scope = $(element).data('scope');

            /**
             * Set settings
             */
            Time[scope] = $.extend( new Time.settings(), valueAccessor() );

            /**
             * Bind button events
             */
            var buttons = $( '.' + Time[scope].button_class, element );
            $(document).on( 'elasticFilter.submit.success', function() {

              buttons.unbind( 'click' );

              buttons.on( 'click', function() {

                buttons.removeClass( Time[scope].active_button_class );
                $(this).addClass( Time[scope].active_button_class );

                var data = $(this).data();

                Filter.flushSettings( scope );
                if ( data.direction ) {
                  Filter[scope].sort_dir = data.direction;
                }
                Filter[scope].period = $(this).data('type');
                Filter.submit( viewModel[scope], scope );
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
          settings: function() {

            /**
             * Show more count
             */
            this.count = 10;

          },

          /**
           * Initialize current binding
           */
          init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            _console.log( 'filterShowMoreControl init', [ element, valueAccessor, allBindings, viewModel, bindingContext ] );

            var
              /**
               * Show more object
               */
              ShowMore = bindings.filterShowMoreControl,

              /**
               * Filter object
               */
              Filter = bindings.elasticFilter,

              /**
               *
               * @type @call;$@call;data
               */
              scope = $(element).data('scope');

            /**
             * Set settings
             */
            ShowMore[scope]         = $.extend( new ShowMore.settings(), valueAccessor() );
            viewModel[scope].moreCount( ShowMore[scope].count );

            /**
             * Bind button events
             */
            $(element).on('click', function(){
              Filter[scope].per_page = ShowMore[scope].count;
              Filter[scope].offset   = viewModel[scope].count();
              Filter[scope].is_more  = true;
              Filter.submit( viewModel[scope], scope );
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
            _console.log( 'foreachprop', [ element, valueAccessor, allBindings, viewModel, bindingContext ] );

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
         * Default index
         */
        _index: 'documents',

        /**
         * Default controllers uri
         */
        _controllers: {
          search: '_search'
        },

        /**
         * Index setter
         * @param {type} index
         * @returns {_L20.$.fn.elasticSearch.api}
         */
        index: function( index ) {
          _console.debug( 'API Index extend', index );

          if ( index ) {
            this._index = index;
          }

          return this;
        },

        /**
         * Controllers setter
         * @param {type} controllers
         * @returns {_L20.$.fn.elasticSearch.api}
         */
        controllers: function( controllers ) {
          _console.debug( 'API Controllers extend', controllers );

          $.extend( this._controllers, controllers );

          return this;
        },

        /**
         * Do Search request
         * @param {type} query
         * @param {type} type
         * @param {type} success
         * @param {type} error
         *
         */
        search: function( query, type, success, error, abort ) {
          _console.log( 'API', api );
          _console.log( 'API Search', arguments );

          if ( !type ) {
            type = '';
          }

          if ( client ) {
            if ( typeof this.ejs_xhr !== 'undefined' && abort ) {
              this.ejs_xhr.abort();
            }
            this.ejs_xhr = client.get( api._index+'/'+type+'/'+api._controllers.search, 'source='+encodeURIComponent(JSON.stringify( query )), success, error );
          } else {
            _console.error( 'API Search Error', 'Client is undefined' );
          }

          return api;
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
          if ( bindings.hasOwnProperty( i ) ) {
            ko.bindingHandlers[i] = bindings[i];
          }
        }
        _console.debug( 'Bindings registered', ko.bindingHandlers );

        /**
         * Init Client
         */
        client = ejs.HttpClient( options.endpoint );
        _console.debug( 'Init Options', options );

        if ( options.headers ) {
          for( i in options.headers ) {
            if ( options.headers.hasOwnProperty( i ) ) {
              client.addHeader( i, options.headers[i] );
            }
          }
        }
        _console.debug( 'Client init', client );

        var scopes = [];
        $( '[data-scope]', self[0] ).each( function() {
          if ( scopes.indexOf( $( this ).data('scope') ) < 0 ) {
            scopes.push( $( this ).data('scope') );
          }
        });
        _console.log( 'Filters enabled', scopes );

        var suggesters = [];
        $( '[data-suggest]', self[0] ).each( function() {
          if ( suggesters.indexOf( $( this ).data('suggest') ) < 0 ) {
            suggesters.push( $( this ).data('suggest') );
          }
        });
        _console.log( 'Suggesters enabled', suggesters );

        /**
         * Virtualize 'html' binding. Needs to be able to use html binding with virtual elements.
         */
        {
          var overridden = ko.bindingHandlers.html.update;

          ko.bindingHandlers.html.update = function(element, valueAccessor) {
            if (element.nodeType === 8) {
              var html = ko.utils.unwrapObservable(valueAccessor());

              ko.virtualElements.emptyNode(element);
              if ((html !== null) && (html !== undefined)) {
                if (typeof html !== 'string') {
                  html = html.toString();
                }

                var parsedNodes = ko.utils.parseHtmlFragment(html);
                if (parsedNodes) {
                  var endCommentNode = element.nextSibling;
                  for (var i = 0, j = parsedNodes.length; i < j; i++) {
                    endCommentNode.parentNode.insertBefore(parsedNodes[i], endCommentNode);
                  }
                }
              }
            } else { // plain node
              overridden(element, valueAccessor);
            }
          };
        }
        ko.virtualElements.allowedBindings.html = true;

        /**
         * Apply view model
         */
        ko.applyBindings( new ViewModel( scopes, suggesters ), self[0] );

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
          "validate": /^[a-zA-Z][a-zA-Z0-9_.-]*(?:\[(?:\d*|[a-zA-Z0-9_.-]+)\])*$/,
          "key": /[a-zA-Z0-9_.-]+|(?=\[\])/g,
          "push": /^$/,
          "fixed": /^\d+$/,
          "named": /^[a-zA-Z0-9_.-]+$/
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
  var cleanObject = $.fn.cleanObject = function ( target ) {
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
