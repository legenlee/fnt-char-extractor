import sharp from "sharp";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import fs from "node:fs";
import path from "node:path";

/**
 * @param {string[]} data
 */
function getAssets(data) {
  const pageColumns = data.filter((d) => d.startsWith("page"));
  return pageColumns.map((pageColumn) =>
    pageColumn
      .split(" ")[2]
      .split("=")[1]
      .replace(/['"]+/g, "")
      .replace("\r", "")
  );
}

/**
 * @param {string[]} data
 */
function getCharColumn(data) {
  return data.filter((d) => d.split(" ")[0] === "char");
}

/**
 * @param {string} column
 * @param {number} index
 */
function columnParser(column, index) {
  return parseInt(column[index].split("=")[1]);
}

/**
 * @param {string} path
 */
async function checkAndMakeDirectory(path) {
  try {
    await fs.promises.access(path, fs.constants.F_OK);
  } catch {
    await fs.promises.mkdir(path);
  }
}

/**
 * @type string[]
 */
let pages = [];

/**
 * @type string[]
 */
let chars = [];

const rl = readline.createInterface({ input, output });
const answer = await rl.question("Input your *.fnt path: ");
const basePath = path.dirname(answer);
const fntPath = path.resolve(answer);

try {
  const file = await fs.promises.stat(fntPath);

  if (file.isFile) {
    const fntData = (await fs.promises.readFile(fntPath)).toString();
    const splitedFntData = fntData.split("\n");
    const extractionPath = path.join(basePath, "extractions");

    await checkAndMakeDirectory(extractionPath);

    const extractionDirectory = await fs.promises.stat(extractionPath);

    pages = getAssets(splitedFntData).map((p) => path.join(basePath, p));
    chars = getCharColumn(splitedFntData);

    if (!extractionDirectory.isDirectory) {
      throw new Error("Cannot make extraction directory. It is already used");
    }

    chars.forEach((char) => {
      const charData = char.split(" ").filter((c) => c !== "");
      const id = columnParser(charData, 1);
      const x = columnParser(charData, 2);
      const y = columnParser(charData, 3);
      const width = columnParser(charData, 4);
      const height = columnParser(charData, 5);
      const page = columnParser(charData, 9);

      const asset = pages[page];
      const fileName = String.fromCharCode(id);
      const filePath = path.join(extractionPath, `${fileName}.png`);

      sharp(asset).extract({ left: x, top: y, width, height }).toFile(filePath);
    });
  } else {
    throw Error("File not valid");
  }
} catch (e) {
  console.log(e.toString());
} finally {
  rl.close();
}
