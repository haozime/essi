/**
 * Created by suyoubi on 15/4/22.
 */

var path = require("path");
var app = require("plug-base");

app.root("src");
app.disableHosts();
app
  .plug(require("../"), {
    replaces:{
      "__aaa__":"bbb1"
    },
    native2ascii:true,
    version: "1.1.1"
  })
  .listen(8080);
