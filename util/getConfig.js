const { t } = require("./i18n");
const dotenv = require("dotenv").config();
module.exports = () => {
  return new Promise((res, rej) => {
    try {
      const config = require("../dev-config");
      res(config);
    } catch {
      try {
        const config = require("../config");
        res(config);
      } catch {
        rej(t("getConfig.auto_294"));
      }
    }
  });
};