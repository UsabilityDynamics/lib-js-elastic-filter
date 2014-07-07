Overview
========

Allows to implement ElasticSearch filter. Uses jQuery, KnockoutJS and XMLHttpRequest client. Supports facets and range filters.

Changelog
=========

= Version 3.0.0 =
* Tests added.
* Some code changed to ba able to test.

= Version 2.8 =
* Added virtual elements support for 'html' KO binding.
* Removed hardcoded values.

= Version 2.7 =
* New property to Suggester - has_text.
* Improved search logic in Suggester.
* Make facets update only if needed.
* Abort XHR if already ran.

= Version 2.6 =
* Added option that allows to use fields-independent full-text search for Suggester.

= Version 2.5 =
* Re-factoring of suggester in order to make it possible to add multiple instances on a page.

= Version 2.0 =
* Re-factoring in order to make possible to use multiple filters on one page.

= Version 1.5.1 =
* Fix to api.search method. Ampersand issue.

= Version 1.5 =
* Fix to serializeObject to allow dots and dashes in names
* Changed api.search method to use GET
* Added option to configure location field
* Hardcoded things removed
* Configurable index and api controllers

= Version 1.0 =
* Removed hardcoded things via triggers
* Added ability to set custom sort direction for time controller
* Fix to sorting direction
* Fixed geo sorting + general fixes

## License

(The MIT License)

Copyright (c) 2013 Usability Dynamics, Inc. &lt;info@usabilitydynamics.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.