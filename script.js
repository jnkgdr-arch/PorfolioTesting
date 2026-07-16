let pdfjsLib = null;

const pdfJsReady = import(
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs"
)
  .then((module) => {
    pdfjsLib = module;

    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";

    return pdfjsLib;
  })
  .catch((error) => {
    console.error("Unable to initialize PDF.js", error);
    return null;
  });

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
        heading:
          "Designed P&G Go-To-Market Strategy & 12-Month Rollout Sub-line Product for Portfolio Growth",
        text:
          "Conceptualized new-market haircare line for portfolio expansion using competitive analysis and a $898M to $1.796B budget estimate.",
      },
    ],
  },
  {
    name: "Chipotle",
    pdfPath: "assets/chipotle.pdf",
    category: "Marketing",
    descriptions: [
      {
        heading:
          "Researched Consumer Demand to Recommend Chipotle's Expansion into China",
        text:
          "Analyzed customer preferences, cultural behaviors, and market opportunities to support localized decision-making.",
      },
    ],
  },
  {
    name: "GA4",
    pdfPath: "assets/ga-4.pdf",
    category: "Analytics",
    descriptions: [
      {
        heading:
          "Examined 318K New Users and $128.5K in Top-Product Revenue to Recommend Sales Strategies",
        text:
          "Analyzed Google Merch Store performance in GA4 using KPI tracking, user engagement data, and e-commerce insights.",
      },
    ],
  },
  {
    name: "Global Tech Project Management",
    pdfPath: "assets/global-tech-project-management.pdf",
    category: "Project Management",
    descriptions: [
      {
        heading:
          "Developed a Project Management Framework to Strengthen Governance, Risk Tracking, and Process Oversight",
        text:
          "Analyzed project gaps, process risks, stakeholder needs, and reporting practices to recommend structured workflow improvements.",
      },
    ],
  },
  {
    name: "Research & Insights",
    pdfPath: "assets/research-and-insights.pdf",
    category: "Research",
    descriptions: [
      {
        heading:
          "Analyzed 500 ABC Restaurant Survey Responses to Recommend Audience and Dining Strategies",
        text:
          "Examined consumer survey data using Excel PivotTables to identify audience segments and recommend food, ambience, and outreach strategies.",
      },
      {
        heading:
          "Compared GDP, Population, and Economic Freedom Across 15 Countries to Evaluate Market Conditions",
        text:
          "Analyzed World Development Indicators and 2025 economic freedom metrics to compare national output, population scale, GDP per capita, and institutional conditions.",
      },
    ],
  },
  {
    name: "SEO & Keyword Search",
    pdfPath: "assets/seo-and-keyword-search.pdf",
    category: "SEO",
    descriptions: [
      {
        heading:
          "Tailored 6 Coleman Marketing Strategies Using Keyword Insights to Guide SEO Recommendations",
        text:
          "Analyzed SEO trends, competition, bid ranges, and search changes to guide Coleman marketing recommendations.",
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
        text:
          "Digital Marketing, Content Creation, Project Management, Competitive Analysis, Campaign Support.",
      },
      {
        heading: "Technical Skills",
        text:
          "Canva, Adobe Photoshop, Microsoft Office Suite, Google Analytics 4, HootSuite.",
      },
      {
        heading: "Soft Skills",
        text:
          "Communication, Collaboration, Attention to Detail, Problem Solving, Adaptability.",
      },
      {
        heading: "Degrees & Certificates",
        link:
          "https://drive.google.com/drive/folders/1JLaXqjosYUGntsv1EYa1kr3qqxCpnmxN?usp=sharing",
        linkLabel:
          "View degrees and certificates in Google Drive",
      },
    ],
  },
];

const grid = document.querySelector("#portfolio-grid");
const focusedProject = document.querySelector("#focused-project");

const focusedPanel = focusedProject.querySelector(
  ".focused-project__panel"
);

const focusedTitle = document.querySelector(
  "#focused-project-title"
);

const focusedCategory = document.querySelector(
  "#focused-project-category"
);

const pdfPages = document.querySelector("#pdf-pages");
const backButton = document.querySelector("#back-button");

const projectDescription = document.querySelector(
  "#project-description"
);

const projectTools = document.querySelector(
  "#project-tools"
);

const pdfCache = new Map();

let previousScrollY = 0;
let previouslyFocusedElement = null;
let activeRenderToken = 0;
let activeProjectPath = "";
let closeTimerId = null;
let currentProject = null;
let resolutionTimerId = null;

function getOutputScale() {
  return Math.min(window.devicePixelRatio || 1, 3);
}

function renderProjects() {
  const cards = projects.map((project) => {
    const card = document.createElement("button");

    card.type = "button";
    card.className = "project-card";

    card.setAttribute(
      "aria-label",
      `Open ${project.name} PDF project`
    );

    const preview = document.createElement("div");

    preview.className = "project-card__preview";

    preview.append(
      createPreviewPlaceholder(project.name)
    );

    const body = document.createElement("div");

    body.className = "project-card__body";

    body.innerHTML = `
      <p class="project-card__category">
        ${project.category || "Project"}
      </p>

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

  placeholder.className =
    "project-card__placeholder";

  placeholder.textContent = name;

  return placeholder;
}

async function getPdfDocument(pdfPath) {
  const library = pdfjsLib || (await pdfJsReady);

  if (!library) {
    throw new Error("PDF.js is unavailable.");
  }

  if (!pdfCache.has(pdfPath)) {
    const loadingPromise = library
      .getDocument(pdfPath)
      .promise.catch((error) => {
        pdfCache.delete(pdfPath);
        throw error;
      });

    pdfCache.set(pdfPath, loadingPromise);
  }

  return pdfCache.get(pdfPath);
}

async function renderPdfThumbnail(
  project,
  preview
) {
  try {
    const pdf = await getPdfDocument(
      project.pdfPath
    );

    const page = await pdf.getPage(1);

    const baseViewport = page.getViewport({
      scale: 1,
    });

    const displayWidth =
      preview.clientWidth || 260;

    const displayHeight =
      preview.clientHeight || 210;

    const widthScale =
      displayWidth / baseViewport.width;

    const heightScale =
      displayHeight / baseViewport.height;

    const cssScale = Math.max(
      widthScale,
      heightScale
    );

    const viewport = page.getViewport({
      scale: cssScale,
    });

    const outputScale = getOutputScale();

    const canvas =
      document.createElement("canvas");

    const context =
      canvas.getContext("2d");

    if (!context) {
      throw new Error(
        "Unable to create a canvas context."
      );
    }

    canvas.width = Math.ceil(
      viewport.width * outputScale
    );

    canvas.height = Math.ceil(
      viewport.height * outputScale
    );

    canvas.style.width =
      `${viewport.width}px`;

    canvas.style.height =
      `${viewport.height}px`;

    canvas.setAttribute(
      "aria-hidden",
      "true"
    );

    const transform =
      outputScale !== 1
        ? [
            outputScale,
            0,
            0,
            outputScale,
            0,
            0,
          ]
        : null;

    await page.render({
      canvasContext: context,
      viewport,
      transform,
    }).promise;

    if (preview.isConnected) {
      preview.replaceChildren(canvas);
    }
  } catch (error) {
    console.error(
      `Unable to render thumbnail for ${project.name}`,
      error
    );
  }
}

function openProject(project) {
  currentProject = project;

  if (closeTimerId !== null) {
    window.clearTimeout(closeTimerId);
    closeTimerId = null;
  }

  previousScrollY = window.scrollY;

  previouslyFocusedElement =
    document.activeElement;

  focusedTitle.textContent = project.name;

  focusedCategory.textContent =
    project.category || "Project";

  renderProjectDescriptions(
    project.descriptions || []
  );

  renderProjectTools(
    project.toolSections || []
  );

  activeRenderToken += 1;

  const renderToken = activeRenderToken;

  activeProjectPath = project.pdfPath;

  pdfPages.replaceChildren(
    createLoadingMessage(project.name)
  );

  focusedProject.hidden = false;

  document.body.classList.add(
    "is-focused"
  );

  requestAnimationFrame(() => {
    focusedProject.classList.add(
      "is-visible"
    );

    focusedPanel.focus();
  });

  renderPdfPages(project, renderToken);
}

function renderProjectDescriptions(
  descriptions
) {
  const populatedDescriptions =
    descriptions.filter(
      ({ heading, text, link }) =>
        heading || text || link
    );

  projectDescription.replaceChildren(
    ...populatedDescriptions.map(
      ({
        heading,
        text,
        link,
        linkLabel,
      }) => {
        const item =
          document.createElement("section");

        item.className =
          "project-description__item";

        if (heading) {
          const headingElement =
            document.createElement("h3");

          headingElement.textContent =
            heading;

          item.append(headingElement);
        }

        if (text) {
          const textElement =
            document.createElement("p");

          textElement.textContent = text;

          item.append(textElement);
        }

        if (link) {
          const linkElement =
            document.createElement("a");

          linkElement.className =
            "project-description__link";

          linkElement.href = link;
          linkElement.target = "_blank";
          linkElement.rel =
            "noopener noreferrer";

          linkElement.setAttribute(
            "aria-label",
            linkLabel ||
              "Open degrees and certificates"
          );

          linkElement.title =
            linkLabel ||
            "Open degrees and certificates";

          linkElement.innerHTML = `
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M10.5 13.5a4 4 0 0 0 5.66 0l2.34-2.34a4 4 0 0 0-5.66-5.66L11.5 6.84"
              ></path>

              <path
                d="M13.5 10.5a4 4 0 0 0-5.66 0L5.5 12.84a4 4 0 0 0 5.66 5.66l1.34-1.34"
              ></path>
            </svg>
          `;

          item.append(linkElement);
        }

        return item;
      }
    )
  );

  projectDescription.hidden =
    populatedDescriptions.length === 0;
}

function renderProjectTools(
  toolSections
) {
  const populatedToolSections =
    toolSections.filter(
      ({ heading, imagePath }) =>
        heading && imagePath
    );

  projectTools.replaceChildren(
    ...populatedToolSections.map(
      ({
        heading,
        imagePath,
        ariaLabel,
      }) => {
        const section =
          document.createElement("section");

        section.className =
          "project-tool-section";

        const headingElement =
          document.createElement("h3");

        headingElement.textContent =
          heading;

        const button =
          document.createElement("button");

        button.className =
          "tool-icon-button";

        button.type = "button";

        button.setAttribute(
          "aria-label",
          ariaLabel ||
            `View ${heading}`
        );

        const image =
          document.createElement("img");

        image.src = imagePath;
        image.alt = "";
        image.loading = "lazy";

        image.addEventListener(
          "error",
          () => {
            console.error(
              `Unable to load tool image: ${imagePath}`
            );

            button.classList.add(
              "has-image-error"
            );

            const errorText =
              document.createElement("span");

            errorText.className =
              "tool-image-error";

            errorText.textContent =
              "Image unavailable";

            button.replaceChildren(
              errorText
            );
          }
        );

        button.append(image);

        section.append(
          headingElement,
          button
        );

        return section;
      }
    )
  );

  projectTools.hidden =
    populatedToolSections.length === 0;
}

async function renderPdfPages(
  project,
  renderToken
) {
  try {
    const selectedPdfPath =
      project.pdfPath;

    const pdf = await getPdfDocument(
      selectedPdfPath
    );

    if (
      renderToken !== activeRenderToken ||
      selectedPdfPath !==
        activeProjectPath
    ) {
      return;
    }

    pdfPages.replaceChildren();

    for (
      let pageNumber = 1;
      pageNumber <= pdf.numPages;
      pageNumber += 1
    ) {
      if (
        renderToken !==
          activeRenderToken ||
        selectedPdfPath !==
          activeProjectPath
      ) {
        return;
      }

      const page =
        await pdf.getPage(pageNumber);

      if (
        renderToken !==
          activeRenderToken ||
        selectedPdfPath !==
          activeProjectPath
      ) {
        return;
      }

      const pageElement =
        await renderPdfPage(
          page,
          project,
          pageNumber
        );

      if (
        renderToken !==
          activeRenderToken ||
        selectedPdfPath !==
          activeProjectPath
      ) {
        return;
      }

      pdfPages.append(pageElement);
    }
  } catch (error) {
    if (
      renderToken !== activeRenderToken ||
      project.pdfPath !==
        activeProjectPath
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

async function renderPdfPage(
  page,
  project,
  pageNumber
) {
  const pageElement =
    document.createElement("article");

  pageElement.className = "pdf-page";

  pageElement.setAttribute(
    "aria-label",
    `${project.name} page ${pageNumber}`
  );

  const baseViewport =
    page.getViewport({
      scale: 1,
    });

  const availableWidth =
    pdfPages.getBoundingClientRect()
      .width || 900;

  const cssScale =
    availableWidth /
    baseViewport.width;

  const viewport =
    page.getViewport({
      scale: cssScale,
    });

  const outputScale =
    getOutputScale();

  const canvas =
    document.createElement("canvas");

  const context =
    canvas.getContext("2d");

  if (!context) {
    throw new Error(
      "Unable to create a canvas context."
    );
  }

  canvas.width = Math.ceil(
    viewport.width * outputScale
  );

  canvas.height = Math.ceil(
    viewport.height * outputScale
  );

  canvas.style.width =
    `${viewport.width}px`;

  canvas.style.height =
    `${viewport.height}px`;

  const annotationLayer =
    document.createElement("div");

  annotationLayer.className =
    "annotationLayer";

  annotationLayer.setAttribute(
    "aria-label",
    `${project.name} page ${pageNumber} links`
  );

  pageElement.style.aspectRatio =
    `${viewport.width} / ${viewport.height}`;

  pageElement.append(
    canvas,
    annotationLayer
  );

  const transform =
    outputScale !== 1
      ? [
          outputScale,
          0,
          0,
          outputScale,
          0,
          0,
        ]
      : null;

  await page.render({
    canvasContext: context,
    viewport,
    transform,
  }).promise;

  const annotations =
    await page.getAnnotations({
      intent: "display",
    });

  renderAnnotationLinks(
    annotations,
    annotationLayer,
    viewport
  );

  return pageElement;
}

function renderAnnotationLinks(
  annotations,
  annotationLayer,
  viewport
) {
  annotations
    .filter(
      (annotation) =>
        annotation.subtype === "Link" &&
        (
          annotation.url ||
          annotation.unsafeUrl
        )
    )
    .forEach((annotation) => {
      const rect =
        viewport.convertToViewportRectangle(
          annotation.rect
        );

      const left = Math.min(
        rect[0],
        rect[2]
      );

      const top = Math.min(
        rect[1],
        rect[3]
      );

      const width = Math.abs(
        rect[0] - rect[2]
      );

      const height = Math.abs(
        rect[1] - rect[3]
      );

      const link =
        document.createElement("a");

      link.href =
        annotation.url ||
        annotation.unsafeUrl;

      link.target = "_blank";

      link.rel =
        "noopener noreferrer";

      link.title =
        annotation.contents ||
        "Open project link in a new tab";

      link.style.left =
        `${left}px`;

      link.style.top =
        `${top}px`;

      link.style.width =
        `${width}px`;

      link.style.height =
        `${height}px`;

      annotationLayer.append(link);
    });
}

function createLoadingMessage(name) {
  const message =
    document.createElement("p");

  message.className = "pdf-message";

  message.textContent =
    `Loading ${name}…`;

  return message;
}

function createErrorMessage(name) {
  const message =
    document.createElement("p");

  message.className = "pdf-message";

  message.textContent =
    `Unable to load ${name}. Please check the PDF path and try again.`;

  return message;
}

function closeProject() {
  currentProject = null;

  activeRenderToken += 1;
  activeProjectPath = "";

  pdfPages.replaceChildren();

  focusedProject.classList.remove(
    "is-visible"
  );

  document.body.classList.remove(
    "is-focused"
  );

  closeTimerId = window.setTimeout(
    () => {
      focusedProject.hidden = true;

      window.scrollTo({
        top: previousScrollY,
        behavior: "auto",
      });

      if (
        previouslyFocusedElement
          instanceof HTMLElement
      ) {
        previouslyFocusedElement.focus();
      }

      closeTimerId = null;
    },
    260
  );
}

function rerenderForResolutionChange() {
  if (
    focusedProject.hidden ||
    !currentProject
  ) {
    renderProjects();
    return;
  }

  const projectToRender =
    currentProject;

  const savedScrollTop =
    focusedPanel.scrollTop;

  activeRenderToken += 1;

  const renderToken =
    activeRenderToken;

  activeProjectPath =
    projectToRender.pdfPath;

  pdfPages.replaceChildren(
    createLoadingMessage(
      projectToRender.name
    )
  );

  renderPdfPages(
    projectToRender,
    renderToken
  ).then(() => {
    if (
      renderToken ===
        activeRenderToken &&
      currentProject ===
        projectToRender
    ) {
      focusedPanel.scrollTop =
        savedScrollTop;
    }
  });
}

backButton.addEventListener(
  "click",
  closeProject
);

document.addEventListener(
  "keydown",
  (event) => {
    if (
      event.key === "Escape" &&
      !focusedProject.hidden
    ) {
      closeProject();
    }
  }
);

window.addEventListener(
  "resize",
  () => {
    window.clearTimeout(
      resolutionTimerId
    );

    resolutionTimerId =
      window.setTimeout(
        rerenderForResolutionChange,
        250
      );
  }
);

renderProjects();
