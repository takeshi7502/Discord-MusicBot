const fs = require("fs");
const path = require("path");
const { AttachmentBuilder } = require("discord.js");

/**
 * Giải quyết iconURL từ config:
 * - Nếu là URL hợp lệ (https://...) → trả về { iconURL, files: [] }
 * - Nếu là đường dẫn file cục bộ → đọc file, đính kèm vào tin nhắn với attachment://
 * @param {string} iconURL - giá trị iconURL từ config
 * @returns {{ iconURL: string|undefined, files: AttachmentBuilder[] }}
 */
function resolveIcon(iconURL) {
  if (!iconURL) return { iconURL: undefined, files: [] };

  // Nếu là HTTP/HTTPS URL hợp lệ → dùng thẳng
  if (/^https?:\/\//i.test(iconURL)) {
    return { iconURL, files: [] };
  }

  // Nếu là đường dẫn file cục bộ → đính kèm file
  try {
    const absolutePath = path.resolve(iconURL);
    if (!fs.existsSync(absolutePath)) {
      return { iconURL: undefined, files: [] };
    }
    const buffer = fs.readFileSync(absolutePath);
    const filename = path.basename(absolutePath);
    const attachment = new AttachmentBuilder(buffer, { name: filename });
    return {
      iconURL: `attachment://${filename}`,
      files: [attachment]
    };
  } catch {
    return { iconURL: undefined, files: [] };
  }
}

module.exports = resolveIcon;
