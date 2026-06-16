/**
 * Import Pages from JSON structure
 * Converts final-json folder structure into database pages
 * Each folder = one page, index.json contains page content structure
 */

const fs = require("fs").promises;
const path = require("path");
const { Page } = require("../models");

/**
 * Generate default CSS for page sections and elements
 */
const generateDefaultCss = () => {
  return `
/* CMS Page Styling */
.cms-section {
  margin: 2rem 0;
  padding: 2rem 0;
}

.cms-section:first-child {
  padding-top: 0;
}

/* Headings */
.cms-section h1 {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1.2;
  margin: 1.5rem 0 1rem 0;
  color: #1a1a1a;
}

.cms-section h2 {
  font-size: 2rem;
  font-weight: 600;
  margin: 1.5rem 0 0.8rem 0;
  color: #1a1a1a;
}

.cms-section h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 1rem 0 0.5rem 0;
  color: #333;
}

.cms-section .heading {
  font-size: 1.1rem;
  font-weight: 500;
  margin: 0.8rem 0;
  color: #444;
}

/* Paragraphs */
.cms-section p {
  font-size: 1rem;
  line-height: 1.6;
  margin: 0.8rem 0;
  color: #555;
}

/* Buttons */
.cms-section .button {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  margin: 1rem 0.5rem 1rem 0;
  background-color: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-weight: 500;
  transition: background-color 0.3s;
  border: none;
  cursor: pointer;
}

.cms-section .button:hover {
  background-color: #0056b3;
}

/* Images */
.cms-section img {
  max-width: 100%;
  height: auto;
  margin: 1rem 0;
  border-radius: 4px;
}

/* Image Box (grid with image and text) */
.cms-section .image-box {
  display: inline-block;
  padding: 1rem;
  margin: 1rem 0.5rem;
  text-align: center;
  background-color: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  transition: box-shadow 0.3s;
}

.cms-section .image-box:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.cms-section .image-box img {
  max-width: 150px;
  height: auto;
  margin: 0 auto 0.5rem;
}

.cms-section .image-box h3 {
  margin: 0.5rem 0;
  font-size: 1.1rem;
}

.cms-section .image-box p {
  margin: 0;
  font-size: 0.9rem;
  color: #666;
}

/* Carousel */
.cms-section .carousel {
  display: flex;
  overflow-x: auto;
  gap: 1rem;
  margin: 1.5rem 0;
  padding: 1rem 0;
}

.cms-section .carousel-slide {
  flex: 0 0 auto;
  min-width: 300px;
  text-align: center;
}

.cms-section .carousel-slide img {
  width: 100%;
  max-width: 300px;
  height: auto;
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.cms-section .carousel-slide .caption {
  font-size: 0.9rem;
  color: #666;
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .cms-section h1 {
    font-size: 2rem;
  }
  
  .cms-section h2 {
    font-size: 1.5rem;
  }
  
  .cms-section .carousel {
    gap: 0.5rem;
  }
  
  .cms-section .carousel-slide {
    min-width: 250px;
  }
}
`.trim();
};

/**
 * Converts a single element to HTML
 */
const elementToHtml = (element) => {
  if (!element || !element.type) return "";

  switch (element.type) {
    case "heading":
      return `<${element.tag || "div"} class="heading">${escapeHtml(element.text || "")}</${element.tag || "div"}>`;

    case "text":
      if (element.paragraphs && Array.isArray(element.paragraphs)) {
        return element.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n");
      }
      return "";

    case "button":
      return `<a href="${escapeAttr(element.url || "#")}" class="button">${escapeHtml(element.text || "")}</a>`;

    case "image":
      return `<img src="${escapeAttr(element.src || "")}" alt="${escapeAttr(element.alt || "")}" width="${
        element.width || "auto"
      }" height="${element.height || "auto"}" />`;

    case "image_box":
      return `<div class="image-box">
        <img src="${escapeAttr(element.src || "")}" alt="${escapeAttr(element.alt || "")}" />
        <h3>${escapeHtml(element.title || "")}</h3>
        <p>${escapeHtml(element.description || "")}</p>
      </div>`;

    case "carousel":
      if (!element.slides || !Array.isArray(element.slides)) return "";
      const slides = element.slides
        .map(
          (slide) =>
            `<div class="carousel-slide">
          <img src="${escapeAttr(slide.src || "")}" alt="${escapeAttr(slide.alt || "")}" />
          ${slide.caption ? `<p class="caption">${escapeHtml(slide.caption)}</p>` : ""}
        </div>`,
        )
        .join("\n");
      return `<div class="carousel">${slides}</div>`;

    default:
      return "";
  }
};

/**
 * Convert sections array to HTML
 */
const sectionsToHtml = (sections) => {
  if (!Array.isArray(sections)) return "";

  return sections
    .map((section) => {
      const elements = section.elements || [];
      const elementHtml = elements.map((el) => elementToHtml(el)).join("\n");
      return `<section class="cms-section" data-index="${section.section_index}">${elementHtml}</section>`;
    })
    .join("\n");
};

/**
 * Escape HTML special characters
 */
const escapeHtml = (text) => {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/**
 * Escape HTML attributes
 */
const escapeAttr = (text) => {
  if (!text) return "";
  return String(text).replace(/"/g, "&quot;").replace(/'/g, "&#039;");
};

/**
 * Normalize slug - keep original format but sanitize for database
 */
const normalizeSlug = (folderName) => {
  // Use folder name as-is, trim spaces and lowercase
  return folderName.trim().toLowerCase();
};

/**
 * Import all pages from final-json folder
 */
const importPagesFromJson = async () => {
  try {
    const jsonFolderPath = path.join(__dirname, "../../../final-json");

    console.log(`📂 Reading from: ${jsonFolderPath}`);
    const entries = await fs.readdir(jsonFolderPath, { withFileTypes: true });

    const pageFolders = entries.filter(
      (entry) => entry.isDirectory() && entry.name !== "node_modules" && !entry.name.startsWith("."),
    );

    console.log(`📄 Found ${pageFolders.length} page folders to import`);

    let imported = 0;
    let errors = 0;

    for (const folder of pageFolders) {
      try {
        const indexJsonPath = path.join(jsonFolderPath, folder.name, "index.json");

        // Check if index.json exists
        await fs.stat(indexJsonPath);
        const jsonContent = await fs.readFile(indexJsonPath, "utf-8");
        const pageData = JSON.parse(jsonContent);

        // Extract page information
        const slug = normalizeSlug(folder.name);
        const title = pageData.page_title || folder.name;
        const metaDescription = pageData.meta?.description || "";
        const metaTitle = pageData.meta?.og_title || title;
        const h1 = pageData.sections?.[1]?.elements?.find((el) => el.tag === "h1")?.text || title;

        // Convert sections to HTML
        const htmlContent = sectionsToHtml(pageData.sections || []);
        const cssContent = generateDefaultCss();

        // Create page in database
        const page = await Page.create({
          slug,
          pageType: "page",
          isSystem: false,
          metaTitle,
          metaDescription,
          h1,
          content: htmlContent,
          htmlContent,
          cssContent,
          jsContent: "", // No JS in JSON
          renderedHtml: htmlContent,
          renderedCss: cssContent,
          renderedJs: "",
          version: 1,
          isPublished: true,
          lastEditedById: 1, // Assuming admin user with ID 1 exists
        });

        console.log(`✓ Imported: ${slug}`);
        imported++;
      } catch (err) {
        console.error(`✗ Error importing ${folder.name}:`, err.message);
        errors++;
      }
    }

    console.log(`\n✅ Import complete: ${imported} pages imported, ${errors} errors`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  }
};

importPagesFromJson();
