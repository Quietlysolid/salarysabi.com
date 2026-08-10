import { chromium } from "playwright";
import { readFile } from "node:fs/promises";

const [referencePath, implementationPath, outputPath] = process.argv.slice(2);
if (!referencePath || !implementationPath || !outputPath) throw new Error("Expected reference, implementation and output paths");
const [reference, implementation] = await Promise.all([readFile(referencePath), readFile(implementationPath)]);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 2080 }, deviceScaleFactor: 1 });
await page.setContent(`<!doctype html><style>body{margin:0;background:#18231e;color:white;font:700 16px Arial}main{display:grid;gap:18px;padding:18px}figure{margin:0}figcaption{margin-bottom:8px;letter-spacing:.08em;text-transform:uppercase}img{display:block;width:100%;height:auto;background:white}</style><main><figure><figcaption>Source visual</figcaption><img src="data:image/png;base64,${reference.toString("base64")}"></figure><figure><figcaption>Implementation</figcaption><img src="data:image/png;base64,${implementation.toString("base64")}"></figure></main>`);
await page.screenshot({ path: outputPath, fullPage: true });
await browser.close();
