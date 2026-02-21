const xlsx = require("xlsx");
const fs = require("fs-extra");
const path = require('path');

// normalize header names
function normalizeKey(k) {
    return String(k || "")
    .trim()
    .toLowerCase()
    .replace("/\s+/g", "_")
    .replace("/[^\w]/g", "")
    .replace(" ", "_");
}

const excelToJson = async (req, res, next) => {
    try{
        if(!req.file?.filename) {
            return res.status(400).json({ message: "file not found" });
        }

        // convert from sheet to json 
        // this process only convert the first sheet
        const filePath = path.join('public', 'uploads', req.file?.filename);
        const wb = xlsx.readFile(filePath, {cellDates: true});
        const sheetName = wb.SheetNames[0];
        const sheet = wb.Sheets[sheetName];
        const raw = xlsx.utils.sheet_to_json(sheet);

        // nomorlize key
        const data = raw.map(row => {
            const out = {};
            for(const [k, v] of Object.entries(row)) out[normalizeKey(k)] = v;
            return out;
        });

        // delete file
        fs.remove(filePath);

        req.excelData = data;
        next();
    } catch(err) {
        return res.status(400).json({ message: "excel parse error: " + err.message });
    }
};

module.exports = excelToJson;
