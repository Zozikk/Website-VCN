const sanitizeHtml = require("sanitize-html");
const postcss = require("postcss");
const prefixSelector = require("postcss-prefix-selector");

const FORBIDDEN_JS_PATTERNS = [
  /\beval\s*\(/i,
  /\bFunction\s*\(/i,
  /document\.write\s*\(/i,
  /\bXMLHttpRequest\b/i,
  /\bfetch\s*\(/i,
  /\blocalStorage\b/i,
  /\bsessionStorage\b/i,
];

const sanitizeCmsHtml = (htmlContent) => {
  return sanitizeHtml(htmlContent, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "img",
      "video",
      "source",
      "section",
      "article",
      "header",
      "footer",
      "main",
      "figure",
      "figcaption",
      "iframe",
      "button",
      "svg",
      "path",
    ]),
    allowedAttributes: {
      "*": ["class", "id", "style", "title", "aria-label", "aria-hidden", "role", "data-*"],
      a: ["href", "name", "target", "rel"],
      img: ["src", "srcset", "alt", "width", "height", "loading"],
      video: ["src", "controls", "autoplay", "muted", "loop", "playsinline", "poster"],
      source: ["src", "type"],
      iframe: ["src", "width", "height", "allow", "allowfullscreen", "loading", "referrerpolicy"],
      button: ["type"],
      svg: ["viewBox", "xmlns", "width", "height", "fill"],
      path: ["d", "fill", "stroke", "stroke-width"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel", "data"],
    allowedSchemesByTag: {
      img: ["http", "https", "data"],
    },
    transformTags: {
      a: (tagName, attribs) => {
        const nextAttribs = { ...attribs };

        if (nextAttribs.target === "_blank" && !nextAttribs.rel) {
          nextAttribs.rel = "noopener noreferrer";
        }

        return { tagName, attribs: nextAttribs };
      },
    },
  });
};

const extractRootIdFromCss = (cssContent) => {
  if (!cssContent || !cssContent.trim()) {
    return null;
  }

  const match = cssContent.match(/#([A-Za-z][\w-]*)\b/);
  return match ? match[1] : null;
};

const ensureHtmlHasRootId = (htmlContent, rootId) => {
  if (!rootId) {
    return htmlContent;
  }

  const idPattern = new RegExp(`id=["']${rootId}["']`, "i");
  if (idPattern.test(htmlContent)) {
    return htmlContent;
  }

  return `<div id="${rootId}">${htmlContent}</div>`;
};

const scopeCss = (cssContent, scopeSelector) => {
  if (!cssContent || !cssContent.trim()) {
    return "";
  }

  const result = postcss([
    prefixSelector({
      prefix: scopeSelector,
      transform: (prefix, selector) => {
        const normalizedSelector = selector.trim();

        if (!normalizedSelector) {
          return normalizedSelector;
        }

        if (normalizedSelector === ":root" || normalizedSelector === "html" || normalizedSelector === "body") {
          return prefix;
        }

        if (normalizedSelector.startsWith(prefix)) {
          return normalizedSelector;
        }

        return `${prefix} ${normalizedSelector}`;
      },
    }),
  ]).process(cssContent, { from: undefined });

  return result.css;
};

const validateAndWrapJs = (jsContent) => {
  if (!jsContent || !jsContent.trim()) {
    return "";
  }

  for (const pattern of FORBIDDEN_JS_PATTERNS) {
    if (pattern.test(jsContent)) {
      throw new Error("Script contains forbidden API usage.");
    }
  }

  return `
((root, pageContext) => {
  "use strict";
${jsContent}
})(root, pageContext);
`.trim();
};

const processCmsContent = ({ slug, htmlContent, cssContent, jsContent }) => {
  const sourceHtml = htmlContent || "";
  const sourceCss = cssContent || "";
  const sourceJs = jsContent || "";
  const scopeSelector = `[data-page-slug="${slug}"]`;
  const cssRootId = extractRootIdFromCss(sourceCss);

  const sanitizedHtml = sanitizeCmsHtml(sourceHtml);
  const renderedHtml = ensureHtmlHasRootId(sanitizedHtml, cssRootId);
  const renderedCss = scopeCss(sourceCss, scopeSelector);
  const renderedJs = validateAndWrapJs(sourceJs);

  return {
    htmlContent: sourceHtml,
    cssContent: sourceCss,
    jsContent: sourceJs,
    renderedHtml,
    renderedCss,
    renderedJs,
  };
};

module.exports = {
  processCmsContent,
};