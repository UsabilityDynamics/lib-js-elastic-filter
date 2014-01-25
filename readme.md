Full Text Search
================
If need to use fulltext search w/o filter on some page:

  <input data-bind="fulltext-search: {minimumInputLength: 3, query:fulltext_search_query, formatSelection:selection_callback}" />

   <input type="text" data-bind="elastic_settings: { access_hash: 'g57sXPt....iPYNXwQ6' }, fulltext-search: {
     minimumInputLength: 3,
     query: hddp.fulltext_search_query,
     formatSelection:hddp.selection_callback
   }" />

* fulltext_search_query - function with query process.
* selection_callback - callback function for click event.

For more parameters see http://ivaynberg.github.com/select2/#documentation

Changelog
=========

= Version 0.4 =
* WebSocket requests must follow RESTful naming convention via ud.socket library.
* The term "Index" now refers to a specific database in an "Account".
* Upon connection the Web Client connects to a specific Account, and will no longer need to specify it on every request.
* Setting "url" and "key" parameters are replaced by "access-key" and "account-id".
* WebSocket connections now must set the account they are connection to as part of the URL, which is a namespace.

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