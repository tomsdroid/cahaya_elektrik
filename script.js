const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#primary-nav");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

menuToggle.addEventListener("click", () => {
  const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isExpanded));
  menuToggle.setAttribute("aria-label", isExpanded ? "Buka navigasi" : "Tutup navigasi");
  navigation.classList.toggle("is-open", !isExpanded);
  navigation.classList.toggle("hidden", isExpanded);
});

navigation.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Buka navigasi");
    navigation.classList.remove("is-open");
    navigation.classList.add("hidden");
  }
});

document.querySelector("#year").textContent = new Date().getFullYear();

function appendMarkdownInline(parent, text) {
  const tokenPattern = /!\[([^\]]*)\]\(([^)]+)\)|\[([^\]]+)\]\(([^)]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|__([^_]+)__|~~([^~]+)~~|\*([^*]+)\*|_([^_]+)_/g;
  let position = 0;
  let match;

  while ((match = tokenPattern.exec(text)) !== null) {
    parent.append(document.createTextNode(text.slice(position, match.index)));

    if (match[1] !== undefined) {
      if (isSafeMarkdownUrl(match[2], true)) {
        const image = document.createElement("img");
        image.src = match[2].trim();
        image.alt = match[1];
        image.loading = "lazy";
        parent.append(image);
      } else {
        parent.append(document.createTextNode(match[1]));
      }
    } else if (match[3] !== undefined) {
      if (isSafeMarkdownUrl(match[4], false)) {
        const link = document.createElement("a");
        link.href = match[4].trim();
        link.textContent = match[3];
        if (/^https?:\/\//i.test(match[4].trim())) {
          link.target = "_blank";
          link.rel = "noopener noreferrer";
        }
        parent.append(link);
      } else {
        parent.append(document.createTextNode(match[3]));
      }
    } else {
      const element = document.createElement(match[5] !== undefined ? "code" : match[8] !== undefined ? "del" : match[6] !== undefined || match[7] !== undefined ? "strong" : "em");
      element.textContent = match[5] ?? match[6] ?? match[7] ?? match[8] ?? match[9] ?? match[10];
      parent.append(element);
    }

    position = tokenPattern.lastIndex;
  }

  parent.append(document.createTextNode(text.slice(position)));
}

function isSafeMarkdownUrl(value, isImage) {
  const url = value.trim();
  if (/^https?:\/\//i.test(url)) {
    return true;
  }
  if (!isImage && /^mailto:/i.test(url)) {
    return true;
  }
  return !url.startsWith("//") && !/^[a-z][a-z\d+.-]*:/i.test(url);
}

function renderMarkdown(markdown) {
  const fragment = document.createDocumentFragment();
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  let paragraphLines = [];
  let list = null;
  let codeLines = null;

  const flushParagraph = () => {
    if (paragraphLines.length === 0) {
      return;
    }
    const paragraph = document.createElement("p");
    appendMarkdownInline(paragraph, paragraphLines.join(" "));
    fragment.append(paragraph);
    paragraphLines = [];
  };

  const flushList = () => {
    list = null;
  };

  lines.forEach((line) => {
    if (codeLines !== null) {
      if (/^\s*```/.test(line)) {
        const pre = document.createElement("pre");
        const code = document.createElement("code");
        code.textContent = codeLines.join("\n");
        pre.append(code);
        fragment.append(pre);
        codeLines = null;
      } else {
        codeLines.push(line);
      }
      return;
    }

    if (/^\s*```/.test(line)) {
      flushParagraph();
      flushList();
      codeLines = [];
      return;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      return;
    }

    const heading = /^(#{1,6})\s+(.+)$/.exec(line.trim());
    if (heading) {
      flushParagraph();
      flushList();
      const element = document.createElement(`h${Math.min(heading[1].length + 1, 6)}`);
      appendMarkdownInline(element, heading[2]);
      fragment.append(element);
      return;
    }

    if (/^(---+|\*\*\*+|___+)$/.test(line.trim())) {
      flushParagraph();
      flushList();
      fragment.append(document.createElement("hr"));
      return;
    }

    const quote = /^\s*>\s?(.*)$/.exec(line);
    if (quote) {
      flushParagraph();
      flushList();
      const blockquote = document.createElement("blockquote");
      const paragraph = document.createElement("p");
      appendMarkdownInline(paragraph, quote[1]);
      blockquote.append(paragraph);
      fragment.append(blockquote);
      return;
    }

    const unorderedItem = /^\s*[-*+]\s+(.*)$/.exec(line);
    const orderedItem = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (unorderedItem || orderedItem) {
      flushParagraph();
      const listType = unorderedItem ? "ul" : "ol";
      if (!list || list.tagName.toLowerCase() !== listType) {
        flushList();
        list = document.createElement(listType);
        fragment.append(list);
      }
      const item = document.createElement("li");
      appendMarkdownInline(item, (unorderedItem || orderedItem)[1]);
      list.append(item);
      return;
    }

    flushList();
    paragraphLines.push(line.trim());
  });

  flushParagraph();
  if (codeLines !== null) {
    const pre = document.createElement("pre");
    const code = document.createElement("code");
    code.textContent = codeLines.join("\n");
    pre.append(code);
    fragment.append(pre);
  }
  return fragment;
}

function createPortfolioCard(item, isDetailed) {
  const article = document.createElement("article");
  article.className = "portfolio-entry";

  const trigger = document.createElement(isDetailed ? "button" : "a");
  trigger.className = "portfolio-entry-trigger";
  if (isDetailed) {
    trigger.type = "button";
    trigger.setAttribute("aria-label", `Lihat detail: ${item.title}`);
    trigger.addEventListener("click", () => openPortfolioDetails(item));
  } else {
    trigger.href = `testimoni-portofolio.html#${encodeURIComponent(item.slug)}`;
    trigger.setAttribute("aria-label", `Lihat detail portofolio: ${item.title}`);
  }

  const category = document.createElement("span");
  category.className = "portfolio-entry-category";
  category.textContent = item.category;

  const title = document.createElement("span");
  title.className = "portfolio-entry-title";
  title.setAttribute("role", "heading");
  title.setAttribute("aria-level", "3");
  title.textContent = item.title;

  const summary = document.createElement("span");
  summary.className = "portfolio-entry-summary";
  summary.textContent = item.summary;

  const more = document.createElement("span");
  more.className = "portfolio-entry-more";
  more.textContent = "Lihat detail →";

  trigger.append(category, title, summary, more);
  article.append(trigger);
  return article;
}

function renderPortfolioGrid(grid, items, isDetailed) {
  if (!grid) {
    return;
  }

  if (items.length === 0) {
    const message = document.createElement("p");
    message.className = "portfolio-empty";
    message.textContent = "Belum ada dokumentasi portofolio.";
    grid.replaceChildren(message);
    return;
  }

  const visibleItems = isDetailed ? items : items.slice(0, 3);
  grid.replaceChildren(...visibleItems.map((item) => createPortfolioCard(item, isDetailed)));
}

function openPortfolioDetails(item) {
  const dialog = document.querySelector("#portfolio-dialog");
  if (!dialog || typeof dialog.showModal !== "function") {
    return;
  }

  document.querySelector("#portfolio-dialog-category").textContent = item.category;
  document.querySelector("#portfolio-dialog-title").textContent = item.title;
  document.querySelector("#portfolio-dialog-summary").textContent = item.summary;

  const metadataList = document.querySelector("#portfolio-dialog-meta");
  metadataList.replaceChildren();
  Object.entries(item.metadata || {}).forEach(([key, value]) => {
    if (!value || ["title", "category", "summary"].includes(key.toLowerCase())) {
      return;
    }
    const term = document.createElement("dt");
    term.textContent = key.replace(/[-_]+/g, " ");
    const description = document.createElement("dd");
    description.textContent = value;
    metadataList.append(term, description);
  });

  document.querySelector("#portfolio-dialog-body").replaceChildren(renderMarkdown(item.content));
  dialog.showModal();
}

const portfolioItems = Array.isArray(window.portfolioItems) ? window.portfolioItems : [];
renderPortfolioGrid(document.querySelector("#home-portfolio-grid"), portfolioItems, false);
renderPortfolioGrid(document.querySelector("#portfolio-grid"), portfolioItems, true);

const portfolioDialog = document.querySelector("#portfolio-dialog");
if (portfolioDialog) {
  document.querySelector("#portfolio-dialog-close").addEventListener("click", () => portfolioDialog.close());
  portfolioDialog.addEventListener("click", (event) => {
    if (event.target === portfolioDialog) {
      portfolioDialog.close();
    }
  });

  const requestedSlug = window.location.hash.slice(1);
  const requestedItem = portfolioItems.find((item) => encodeURIComponent(item.slug) === requestedSlug);
  if (requestedItem) {
    openPortfolioDetails(requestedItem);
  }
}

document.querySelectorAll("main details").forEach((details) => {
  const summary = details.querySelector(":scope > summary");
  const answer = details.querySelector(":scope > .faq-answer");
  if (!summary || !answer || typeof answer.animate !== "function") {
    return;
  }

  summary.addEventListener("click", (event) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    event.preventDefault();
    if (details.dataset.animating === "true") {
      return;
    }

    const isOpening = !details.open;
    details.dataset.animating = "true";
    answer.style.overflow = "hidden";

    if (isOpening) {
      details.open = true;
      const targetHeight = answer.scrollHeight;
      const animation = answer.animate(
        [{ height: "0px", opacity: 0 }, { height: `${targetHeight}px`, opacity: 1 }],
        { duration: 300, easing: "cubic-bezier(.2,.7,.2,1)" }
      );
      animation.onfinish = () => {
        answer.style.removeProperty("overflow");
        delete details.dataset.animating;
      };
      return;
    }

    const currentHeight = answer.getBoundingClientRect().height;
    const animation = answer.animate(
      [{ height: `${currentHeight}px`, opacity: 1 }, { height: "0px", opacity: 0 }],
      { duration: 240, easing: "ease-in" }
    );
    animation.onfinish = () => {
      details.open = false;
      answer.style.removeProperty("overflow");
      delete details.dataset.animating;
    };
  });
});

if (!prefersReducedMotion && "IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

  document.querySelectorAll("main > section").forEach((section) => {
    section.classList.add("scroll-reveal");
    revealObserver.observe(section);
  });
}
