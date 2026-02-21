const csv = require("csvtojson");
const path = require("path");
const fs = require("fs-extra");

// normalize header names
function normalizeKey(k) {
  return String(k || "")
    .trim()
    .toLowerCase()
    .replace("/\s+/g", "_")
    .replace("/[^\w]/g", "")
    .replace(" ", "_");
}

const csvToJson = (req, res, next) => {
  try {
    if (!req.file?.filename) {
      return res.status(400).json({ message: "file not found" });
    }

    const filePath = path.join("public", "uploads", req.file?.filename);

    csv()
      .fromFile(filePath)
      .then((json) => {
        // nomorlize key
        const data = json.map((row) => {
          const out = {};
          for (const [k, v] of Object.entries(row)) out[normalizeKey(k)] = v;
          return out;
        });
        
        // delete file
        fs.remove(filePath);
        req.csvData = JSON.stringify(data, null, 2);
        next();
      });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

module.exports = csvToJson;
