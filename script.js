import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";

/*
  EDITABLE PROJECT DATA
  ---------------------
  Change each `name` value below to edit the primary project title shown on the
  card and at the top of the right-side information panel.

  Keep `pdfPath` pointed at the PDF that should open in the focused project view.
  Update `category` to change the smaller label above each project title.

  Edit `descriptions` for each PDF to change the bold description header(s)
  and smaller supporting description text in the right-side panel. Add one or
  more `{ heading, text }` entries, or leave `descriptions: []` empty to hide
  the section.

  Edit `toolSections` to add medium icon buttons beneath tool section headings.
  Each tool section uses `{ heading, imagePath, ariaLabel }`. Leave
  `toolSections: []` empty to hide the section.
*/
const projects = [
  {
    name: "About Me",
    pdfPath: "assets/about-me.pdf",
    category: "Introduction",
    descriptions: [],
    toolSections: [
      {
        heading: "Design Tools",
        imagePath: "assets/designs-tools.png",
        ariaLabel: "View design tools",
      },
      {
        heading: "Tools Used",
        imagePath: "assets/website-builder-tools.png",
        ariaLabel: "View website builder tools",
      },
    ],
  },
  {
    name: "Procter & Gamble",
    pdfPath: "assets/procter-and-gamble.pdf",
    category: "Brand Strategy",
    descriptions: [
      {
        heading: "Designed P&G Go-To-Market Strategy & 12-Month Rollout Sub-line Product for Portfolio Growth",
        text: "Conceptualized new-market haircare line for portfolio expansion using competitive analysis and a $898M to $1.796B budget estimate.",
      },
    ],
  },
  {
    name: "Chipotle",
    pdfPath: "assets/chipotle.pdf",
    category: "Marketing",
    descriptions: [
      {
        heading: "Researched Consumer Demand to Recommend Chipotle's Expansion into China",
        text: "Analyzed customer preferences, cultural behaviors, and market opportunities to support localized decision-making.",
      },
    ],
  },
  {
    name: "GA4",
    pdfPath: "assets/ga-4.pdf",
    category: "Analytics",
    descriptions: [
      {
        heading: "Examined 318K New Users and $128.5K in Top-Product Revenue to Recommend Sales Strategies",
        text: "Analyzed Google Merch Store performance in GA4 using KPI tracking, user engagement data, and e-commerce insights.",
      },
    ],
  },
  {
    name: "Global Tech Project Management",
    pdfPath: "assets/global-tech-project-management.pdf",
    category: "Project Management",
    descriptions: [
      {
        heading: "Developed a Project Management Framework to Strengthen Governance, Risk Tracking, and Process Oversight",
        text: "Analyzed project gaps, process risks, stakeholder needs, and reporting practices to recommend structured workflow improvements.",
      },
    ],
  },
  {
    name: "Research & Insights",
    pdfPath: "assets/research-and-insights.pdf",
    category: "Research",
    descriptions: [
      {
        heading: "Analyzed 500 ABC Restaurant Survey Responses to Recommend Audience and Dining Strategies",
        text: "Examined consumer survey data using Excel PivotTables to identify audience segments and recommend food, ambience, and outreach strategies.",
      },
      {
        heading: "Compared GDP, Population, and Economic Freedom Across 15 Countries to Evaluate Market Conditions",
        text: "Analyzed World Development Indicators and 2025 economic freedom metrics to compare national output, population scale, GDP per capita, and institutional conditions.",
      },
    ],
  },
  {
    name: "SEO & Keyword Search",
    pdfPath: "assets/seo-and-keyword-search.pdf",
    category: "SEO",
    descriptions: [
      {
        heading: "Tailored 6 Coleman Marketing Strategies Using Keyword Insights to Guide SEO Recommendations",
        text: "Analyzed SEO trends, competition, bid ranges, and search changes to guide Coleman marketing recommendations.",
      },
    ],
  },
  {
    name: "Content Designs",
    pdfPath: "assets/content-designs.pdf",
    category: "Design",
    descriptions: [],
  },
  {
    name: "Administrative Work & Inventory",
    pdfPath: "assets/administrative-work-and-inventory.pdf",
    category: "Operations",
    descriptions: [],
  },
  {
    name: "Experience & Contact",
    pdfPath: "assets/experience-and-contact.pdf",
    category: "Contact",
    descriptions: [
      {
        heading: "Core Skills",
        text: "Digital Marketing, Content Creation, Project Management, Competitive Analysis, Campaign Support.",
      },
      {
        heading: "Technical Skills",
        text: "Canva, Adobe Photoshop, Microsoft Office Suite, Google Analytics 4, HootSuite.",
      },
      {
        heading: "Soft Skills",
        text: "Communication, Collaboration, Attention to Detail, Problem Solving, Adaptability.",
      },
    ],
  },
];

const grid = document.querySelector("#portfolio-grid");
const focusedProject = document.querySelector("#focused-project");
const focusedPanel = focusedProject.querySelector(".focused-project__panel");
const focusedTitle = document.querySelector("#focused-project-title");
const focusedCategory = document.querySelector("#focused-project-category");
const pdfPages = document.querySelector("#pdf-pages");
const backButton = document.querySelector("#back-button");
const projectDescription = document.querySelector("#project-description");
const projectTools = document.querySelector("#project-tools");

const pdfCache = new Map();
let previousScrollY = 0;
let previouslyFocusedElement = null;
let activeRenderToken = 0;
let activeProjectPath = "";
let closeTimerId = null;

function renderProjects() {
  const cards = projects.map((project) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "project-card";
    card.setAttribute("aria-label", `Open ${project.name} PDF project`);

    const preview = document.createElement("div");
    preview.className = "project-card__preview";
    preview.append(createPreviewPlaceholder(project.name));

    const body = document.createElement("div");
    body.className = "project-card__body";
    body.innerHTML = `
      <p class="project-card__category">${project.category || "Project"}</p>
      <h2>${project.name}</h2>
    `;

    card.append(preview, body);
    card.addEventListener("click", () => {
      openProject(project);
    });
    renderPdfThumbnail(project, preview);
    return card;
  });

  grid.replaceChildren(...cards);
}

function createPreviewPlaceholder(name) {
  const placeholder = document.createElement("div");
  placeholder.className = "project-card__placeholder";
  placeholder.textContent = name;
  return placeholder;
}

async function getPdfDocument(pdfPath) {
  if (!pdfCache.has(pdfPath)) {
    pdfCache.set(pdfPath, pdfjsLib.getDocument(pdfPath).promise);
  }

  return pdfCache.get(pdfPath);
}

async function renderPdfThumbnail(project, preview) {
  try {
    const pdf = await getPdfDocument(project.pdfPath);
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 0.45 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    canvas.setAttribute("aria-hidden", "true");

    await page.render({ canvasContext: context, viewport }).promise;
    preview.replaceChildren(canvas);
  } catch (error) {
    console.error(`Unable to render thumbnail for ${project.name}`, error);
  }
}

function openProject(project) {
  if (closeTimerId !== null) {
    window.clearTimeout(closeTimerId);
    closeTimerId = null;
  }

  previousScrollY = window.scrollY;
  previouslyFocusedElement = document.activeElement;

  focusedTitle.textContent = project.name;
  focusedCategory.textContent = project.category || "Project";

  renderProjectDescriptions(project.descriptions || []);
  renderProjectTools(project.toolSections || []);

  /*
    Every project selection receives a unique render token.
    This invalidates rendering work from previously selected PDFs.
  */
  activeRenderToken += 1;

  const renderToken = activeRenderToken;
  activeProjectPath = project.pdfPath;

  /*
    Clear the previous PDF immediately before opening the new one.
  */
  pdfPages.replaceChildren(
    createLoadingMessage(project.name)
  );

  focusedProject.hidden = false;
  document.body.classList.add("is-focused");

  requestAnimationFrame(() => {
    focusedProject.classList.add("is-visible");
    focusedPanel.focus();
  });

  renderPdfPages(project, renderToken);
}

function renderProjectDescriptions(descriptions) {
  const populatedDescriptions = descriptions.filter(({ heading, text }) => heading || text);

  projectDescription.replaceChildren(
    ...populatedDescriptions.map(({ heading, text }) => {
      const item = document.createElement("section");
      item.className = "project-description__item";

      if (heading) {
        const headingElement = document.createElement("h3");
        headingElement.textContent = heading;
        item.append(headingElement);
      }

      if (text) {
        const textElement = document.createElement("p");
        textElement.textContent = text;
        item.append(textElement);
      }

      return item;
    }),
  );

  projectDescription.hidden = populatedDescriptions.length === 0;
}

function renderProjectTools(toolSections) {
  const populatedToolSections = toolSections.filter(({ heading, imagePath }) => heading && imagePath);

  projectTools.replaceChildren(
    ...populatedToolSections.map(({ heading, imagePath, ariaLabel }) => {
      const section = document.createElement("section");
      section.className = "project-tool-section";

      const headingElement = document.createElement("h3");
      headingElement.textContent = heading;

      const button = document.createElement("button");
      button.className = "tool-icon-button";
      button.type = "button";
      button.setAttribute("aria-label", ariaLabel || `View ${heading}`);

      const image = document.createElement("img");
      image.src = imagePath;
      image.alt = "";
      image.loading = "lazy";

      image.addEventListener("error", () => {
        console.error(`Unable to load tool image: ${imagePath}`);

        button.classList.add("has-image-error");
        button.removeAttribute("href");
        button.removeAttribute("target");

        const errorText = document.createElement("span");
        errorText.className = "tool-image-error";
        errorText.textContent = "Image unavailable";

        button.replaceChildren(errorText);
      });

      button.append(image);
      section.append(headingElement, button);
      return section;
    }),
  );

  projectTools.hidden = populatedToolSections.length === 0;
}


async function renderPdfPages(project, renderToken) {
  try {
    const selectedPdfPath = project.pdfPath;
    const pdf = await getPdfDocument(selectedPdfPath);

    /*
      Stop if another project was selected while this PDF
      was loading.
    */
    if (
      renderToken !== activeRenderToken ||
      selectedPdfPath !== activeProjectPath
    ) {
      return;
    }

    pdfPages.replaceChildren();

    for (
      let pageNumber = 1;
      pageNumber <= pdf.numPages;
      pageNumber += 1
    ) {
      /*
        Check before requesting every page.
      */
      if (
        renderToken !== activeRenderToken ||
        selectedPdfPath !== activeProjectPath
      ) {
        return;
      }

      const page = await pdf.getPage(pageNumber);

      /*
        Check again because the selected project may have
        changed while getPage() was running.
      */
      if (
        renderToken !== activeRenderToken ||
        selectedPdfPath !== activeProjectPath
      ) {
        return;
      }

      const pageElement = await renderPdfPage(
        page,
        project,
        pageNumber
      );

      /*
        Do not append a page from an old PDF after another
        project has been selected.
      */
      if (
        renderToken !== activeRenderToken ||
        selectedPdfPath !== activeProjectPath
      ) {
        return;
      }

      pdfPages.append(pageElement);
    }
  } catch (error) {
    /*
      Do not show an error from an outdated render request.
    */
    if (
      renderToken !== activeRenderToken ||
      project.pdfPath !== activeProjectPath
    ) {
      return;
    }

    console.error(
      `Unable to render PDF for ${project.name}`,
      error
    );

    pdfPages.replaceChildren(
      createErrorMessage(project.name)
    );
  }
}

async function renderPdfPage(page, project, pageNumber) {
  const pageElement = document.createElement("article");
  pageElement.className = "pdf-page";
  pageElement.setAttribute("aria-label", `${project.name} page ${pageNumber}`);

  const unscaledViewport = page.getViewport({ scale: 1 });
  const availableWidth = pdfPages.clientWidth || 900;
  const scale = availableWidth / unscaledViewport.width;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  const annotationLayer = document.createElement("div");
  annotationLayer.className = "annotationLayer";
  annotationLayer.setAttribute("aria-label", `${project.name} page ${pageNumber} links`);

  pageElement.style.aspectRatio = `${viewport.width} / ${viewport.height}`;
  pageElement.append(canvas, annotationLayer);

  await page.render({ canvasContext: context, viewport }).promise;
  const annotations = await page.getAnnotations({ intent: "display" });
  renderAnnotationLinks(annotations, annotationLayer, viewport);

  return pageElement;
}

function renderAnnotationLinks(annotations, annotationLayer, viewport) {
  annotations
    .filter((annotation) => annotation.subtype === "Link" && (annotation.url || annotation.unsafeUrl))
    .forEach((annotation) => {
      const rect = viewport.convertToViewportRectangle(annotation.rect);
      const left = Math.min(rect[0], rect[2]);
      const top = Math.min(rect[1], rect[3]);
      const width = Math.abs(rect[0] - rect[2]);
      const height = Math.abs(rect[1] - rect[3]);
      const link = document.createElement("a");

      link.href = annotation.url || annotation.unsafeUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.title = annotation.contents || "Open project link in a new tab";
      link.style.left = `${left}px`;
      link.style.top = `${top}px`;
      link.style.width = `${width}px`;
      link.style.height = `${height}px`;

      annotationLayer.append(link);
    });
}

function createLoadingMessage(name) {
  const message = document.createElement("p");
  message.className = "pdf-message";
  message.textContent = `Loading ${name}…`;
  return message;
}

function createErrorMessage(name) {
  const message = document.createElement("p");
  message.className = "pdf-message";
  message.textContent = `Unable to load ${name}. Please check the PDF path and try again.`;
  return message;
}

function closeProject() {
  /*
    Incrementing the token cancels the currently running
    PDF rendering process.
  */
  activeRenderToken += 1;
  activeProjectPath = "";

  /*
    Remove the current PDF immediately so it cannot appear
    beneath the next selected project.
  */
  pdfPages.replaceChildren();

  focusedProject.classList.remove("is-visible");
  document.body.classList.remove("is-focused");

  closeTimerId = window.setTimeout(() => {
    focusedProject.hidden = true;

    window.scrollTo({
      top: previousScrollY,
      behavior: "auto"
    });

    if (previouslyFocusedElement instanceof HTMLElement) {
      previouslyFocusedElement.focus();
    }

    closeTimerId = null;
  }, 260);
}

backButton.addEventListener("click", closeProject);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !focusedProject.hidden) {
    closeProject();
  }
});

renderProjects();
