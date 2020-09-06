// code stolen from https://www.angulararchitects.io/aktuelles/extending-the-angular-clis-build-process/
exports.default = {
  pre: function () {
  },
  config: function (cfg) {
    var time = new Date().getTime();
    // var pattern = 'getting-started.[name].' + time + '.js';
    var pattern = 'mcms-form.[name].js';
    cfg.output.filename = pattern;
    return cfg;
  },
  post: function () {
  }
}
