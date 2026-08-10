import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";

const baseURL = process.env.AUDIT_BASE_URL || "http://localhost:3001";
const output = "design-audit/accessibility-current";
const routes = [
  ["home", "/"],
  ["payslip", "/payslip-checker"],
  ["jobs", "/jobs"],
  ["post-job", "/post-a-job"],
  ["account", "/account"],
  ["methodology", "/how-paye-is-calculated"],
  ["deductions", "/eligible-deductions"],
  ["tax-bands", "/tax-bands"],
  ["privacy", "/privacy"],
  ["disclaimer", "/disclaimer"],
];

await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const report = [];

async function inspect(page, name, path, viewport, suffix) {
  await page.setViewportSize(viewport);
  await page.goto(`${baseURL}${path}`, { waitUntil: "networkidle" });

  const findings = await page.evaluate(() => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      return style.visibility !== "hidden" && style.display !== "none" && box.width > 0 && box.height > 0;
    };
    const controls = [...document.querySelectorAll("a[href],button,input,select,textarea,summary,[tabindex]")].filter(visible);
    const unlabeled = controls.filter((element) => {
      if (element.matches('input[type="hidden"]')) return false;
      const text = (element.getAttribute("aria-label") || element.getAttribute("title") || element.textContent || "").trim();
      const labelledBy = element.getAttribute("aria-labelledby");
      const label = element.id ? document.querySelector(`label[for="${CSS.escape(element.id)}"]`) : null;
      const wrapped = element.closest("label");
      return !text && !labelledBy && !label && !wrapped;
    }).map((element) => element.outerHTML.slice(0, 180));
    const duplicateIds = [...document.querySelectorAll("[id]")]
      .map((element) => element.id)
      .filter((id, index, ids) => ids.indexOf(id) !== index);
    const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].filter(visible).map((heading) => ({ level: Number(heading.tagName[1]), text: heading.textContent.trim().slice(0, 80) }));
    const headingSkips = headings.filter((heading, index) => index > 0 && heading.level > headings[index - 1].level + 1);
    const smallTargets = controls.map((element) => {
      const box = element.getBoundingClientRect();
      return { label: (element.getAttribute("aria-label") || element.textContent || element.getAttribute("name") || element.tagName).trim().slice(0, 60), width: Math.round(box.width), height: Math.round(box.height) };
    }).filter((target) => target.width < 24 || target.height < 24);
    const imagesWithoutAlt = [...document.querySelectorAll("img")].filter((image) => !image.hasAttribute("alt")).map((image) => image.src);
    const parseColor = (value) => {
      const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      return match ? [Number(match[1]), Number(match[2]), Number(match[3]), match[4] === undefined ? 1 : Number(match[4])] : null;
    };
    const luminance = ([red, green, blue]) => {
      const channels = [red, green, blue].map((channel) => {
        const value = channel / 255;
        return value <= .03928 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
      });
      return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
    };
    const contrastIssues = [...document.querySelectorAll("body *")].filter((element) => visible(element) && [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim())).flatMap((element) => {
      const style = getComputedStyle(element);
      const foreground = parseColor(style.color);
      if (!foreground) return [];
      let backgroundElement = element;
      let background = null;
      while (backgroundElement && !background) {
        const candidate = parseColor(getComputedStyle(backgroundElement).backgroundColor);
        if (candidate && candidate[3] > .98) background = candidate;
        backgroundElement = backgroundElement.parentElement;
      }
      background ||= [255, 255, 255, 1];
      const light = Math.max(luminance(foreground), luminance(background));
      const dark = Math.min(luminance(foreground), luminance(background));
      const ratio = (light + .05) / (dark + .05);
      const size = Number.parseFloat(style.fontSize);
      const weight = Number.parseInt(style.fontWeight, 10) || 400;
      const large = size >= 24 || (size >= 18.66 && weight >= 700);
      if (ratio >= (large ? 3 : 4.5)) return [];
      return [{ text: element.textContent.trim().replace(/\s+/g, " ").slice(0, 80), ratio: Number(ratio.toFixed(2)), color: style.color, background: `rgb(${background.slice(0, 3).join(", ")})` }];
    });
    const landmarks = { main: document.querySelectorAll("main").length, nav: document.querySelectorAll("nav").length, h1: document.querySelectorAll("h1").length };
    return {
      title: document.title,
      landmarks,
      unlabeled,
      duplicateIds: [...new Set(duplicateIds)],
      headingSkips,
      smallTargets: smallTargets.slice(0, 20),
      imagesWithoutAlt,
      contrastIssues: contrastIssues.slice(0, 30),
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    };
  });

  await page.screenshot({ path: `${output}/${suffix}-${name}.png`, fullPage: true });

  const focusOrder = [];
  const focusStyles = [];
  await page.locator("body").click({ position: { x: 1, y: 1 } });
  for (let index = 0; index < 14; index += 1) {
    await page.keyboard.press("Tab");
    const focus = await page.evaluate(() => {
      const element = document.activeElement;
      if (!element) return { label: "none", outline: "none" };
      const style = getComputedStyle(element);
      return {
        label: `${element.tagName.toLowerCase()}:${(element.getAttribute("aria-label") || element.textContent || element.getAttribute("name") || "").trim().replace(/\s+/g, " ").slice(0, 70)}`,
        outline: `${style.outlineStyle} ${style.outlineWidth} ${style.outlineColor}`,
      };
    });
    focusOrder.push(focus.label);
    focusStyles.push(focus.outline);
  }
  report.push({ name, path, viewport, findings, focusOrder, focusStyles });
}

const desktop = await browser.newPage();
for (let index = 0; index < routes.length; index += 1) {
  const [name, path] = routes[index];
  await inspect(desktop, name, path, { width: 1440, height: 1100 }, String(index + 1).padStart(2, "0"));
}
await desktop.close();

const mobile = await browser.newPage();
await inspect(mobile, "home-mobile", "/", { width: 500, height: 900 }, "11");
await inspect(mobile, "jobs-mobile", "/jobs", { width: 500, height: 900 }, "12");
await mobile.getByRole("button", { name: "Filter jobs" }).click();
await mobile.screenshot({ path: `${output}/13-jobs-mobile-filters.png`, fullPage: true });
await inspect(mobile, "post-job-mobile", "/post-a-job", { width: 500, height: 900 }, "14");
await inspect(mobile, "privacy-mobile", "/privacy", { width: 500, height: 900 }, "15");
await inspect(mobile, "disclaimer-mobile", "/disclaimer", { width: 500, height: 900 }, "16");
await mobile.close();

const interactions = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
await interactions.goto(`${baseURL}/`, { waitUntil: "networkidle" });
await interactions.getByLabel("Salary before deductions").fill("750000");
await interactions.getByRole("button", { name: "Show my PAYE estimate" }).click();
const calculatorLiveRegion = await interactions.locator('[aria-live="polite"]').evaluate((element) => ({
  text: element.textContent.trim().replace(/\s+/g, " ").slice(0, 240),
  hidden: element.hidden,
}));

await interactions.goto(`${baseURL}/post-a-job`, { waitUntil: "networkidle" });
await interactions.getByRole("button", { name: "Continue to pay" }).click();
const postJobValidation = await interactions.evaluate(() => ({
  activeName: document.activeElement?.getAttribute("name"),
  invalidNames: [...document.querySelectorAll(":invalid")].map((element) => element.getAttribute("name")).filter(Boolean),
}));

await interactions.setViewportSize({ width: 500, height: 900 });
await interactions.goto(`${baseURL}/jobs`, { waitUntil: "networkidle" });
await interactions.getByText("Menu", { exact: true }).focus();
await interactions.keyboard.press("Enter");
const mobileMenuKeyboard = await interactions.locator(".mobile-nav details").evaluate((element) => ({
  open: element.open,
  links: [...element.querySelectorAll("a")].map((link) => link.textContent.trim()),
}));
await interactions.close();

report.push({ interactions: { calculatorLiveRegion, postJobValidation, mobileMenuKeyboard } });

await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
await browser.close();

console.log(`Captured ${report.length} audited states in ${output}.`);
