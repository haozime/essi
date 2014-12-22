var urlLib = require("url");
var pathLib = require("path");
var fsLib = require("fs");

var Local = require("./lib/local");
var Remote = require("./lib/remote");
var AssetsTool = require("./lib/assetsTool");
var Helper = require("./lib/helper");

/**
 * ESSI类
 */
function ESSI(param, dir) {
  var moduleName = pathLib.basename(__dirname);

  this.param = require("./lib/param");

  this.confFile = pathLib.join(process.cwd(), dir || ('.' + moduleName), moduleName + ".json");

  var confDir = pathLib.dirname(this.confFile);
  if (!fsLib.existsSync(confDir)) {
    Helper.mkdirPSync(confDir);
  }

  if (!fsLib.existsSync(this.confFile)) {
    fsLib.writeFileSync(this.confFile, JSON.stringify(this.param, null, 2), {encoding: "utf-8"});
  }

  var conf = JSON.parse(fsLib.readFileSync(this.confFile));
  this.param = Helper.merge(true, this.param, conf, param || {});

  this.cacheDir = pathLib.join(confDir, "cache");
  if (!fsLib.existsSync(this.cacheDir)) {
    Helper.mkdirPSync(this.cacheDir);
  }
};
ESSI.prototype = {
  constructor: ESSI,
  config: function (param) {
    this.param = Helper.merge(true, this.param, param || {});
  },
  handle: function(req, res, next) {
    var _url = urlLib.parse(req.url).pathname;
    Helper.Log.request(req.url);

    var realpath = Helper.matchVirtual(_url, this.param.rootdir, this.param.virtual);
    var local = new Local(_url, this.param.rootdir, this.param.virtual, this.param.remote);
    var content = local.fetch(realpath);

    // 替换用户定义标记，支持正则
    content = Helper.customReplace(content, this.param.replaces);

    // 抓取远程页面
    var self = this;
    var remote = new Remote(content, this.cacheDir, this.param.hosts);
    remote.fetch(function (content) {
      // TODO AssetsTool
      var assetsTool = new AssetsTool();
      content = assetsTool.action(content, false);

      res.write(Helper.encode(content, self.param.charset));
      res.end();

      Helper.Log.response(req.url+"\n");

      try {
        next();
      }
      catch (e) {}
    });
  }
};

exports = module.exports = ESSI;
