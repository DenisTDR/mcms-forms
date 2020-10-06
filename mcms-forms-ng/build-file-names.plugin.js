// code stolen from https://www.angulararchitects.io/aktuelles/extending-the-angular-clis-build-process/
exports.default = {
  pre: function () {
  },
  config: function (cfg) {
    cfg.output.filename = 'mcms-form.[name].js';
    return cfg;
  },
  post: function () {
  }
}
