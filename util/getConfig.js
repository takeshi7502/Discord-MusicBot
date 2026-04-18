const { t } = require("./i18n");
const dotenv = require("dotenv").config();

function sanitizeConfig(config) {
  // Discord chỉ chấp nhận HTTPS URL cho iconURL trong embed
  // Nếu là đường dẫn local (./...) thì set về undefined để tránh crash
  if (config.iconURL && !/^https?:\/\//i.test(config.iconURL)) {
    config.iconURL = undefined;
  }
  return config;
}

module.exports = () => {
  return new Promise((res, rej) => {
    try {
      const config = require("../dev-config");
      res(sanitizeConfig(config));
    } catch {
      try {
        const config = require("../config");
        res(sanitizeConfig(config));
      } catch {
        rej(t("getConfig.auto_294"));
      }
    }
  });
};