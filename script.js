const STORAGE_KEY = "dynamicStudentPortfolioData";

const defaultState = {
  currentStep: 0,
  theme: "modern",
  darkMode: false,
  personal: {
    fullName: "",
    email: "",
    phone: "",
    photo: "",
    bio: ""
  },
  education: {
    college: "",
    degree: "",
    gradYear: ""
  },
  skills: [{ name: "JavaScript", level: 85 }],
  projects: [
    {
      title: "Campus Connect App",
      description: "A student-focused web app that helps learners discover events, clubs, and resources.",
      link: "https://example.com"
    }
  ],
  socials: {
    github: "",
    linkedin: "",
    portfolioUrl: ""
  }
};

let state = loadState();

const form = document.querySelector("#portfolioForm");
const preview = document.querySelector("#portfolioPreview");
const stepTabs = document.querySelectorAll(".step-tab");
const stepPanels = document.querySelectorAll(".form-step");
const skillsList = document.querySelector("#skillsList");
const projectsList = document.querySelector("#projectsList");

const fields = {
  fullName: document.querySelector("#fullName"),
  email: document.querySelector("#email"),
  phone: document.querySelector("#phone"),
  photoUpload: document.querySelector("#photoUpload"),
  bio: document.querySelector("#bio"),
  college: document.querySelector("#college"),
  degree: document.querySelector("#degree"),
  gradYear: document.querySelector("#gradYear"),
  github: document.querySelector("#github"),
  linkedin: document.querySelector("#linkedin"),
  portfolioUrl: document.querySelector("#portfolioUrl"),
  themeSelect: document.querySelector("#themeSelect"),
  darkModeToggle: document.querySelector("#darkModeToggle")
};

document.querySelector("#addSkillBtn").addEventListener("click", addSkill);
document.querySelector("#addProjectBtn").addEventListener("click", addProject);
document.querySelector("#prevStepBtn").addEventListener("click", () => changeStep(state.currentStep - 1));
document.querySelector("#nextStepBtn").addEventListener("click", () => changeStep(state.currentStep + 1));
document.querySelector("#resetBtn").addEventListener("click", resetForm);
document.querySelector("#downloadHtmlBtn").addEventListener("click", downloadPortfolioHtml);
document.querySelector("#downloadPdfBtn").addEventListener("click", downloadResumePdf);

stepTabs.forEach((tab) => {
  tab.addEventListener("click", () => changeStep(Number(tab.dataset.step)));
});

form.addEventListener("input", handleFormInput);
fields.themeSelect.addEventListener("change", handleThemeChange);
fields.darkModeToggle.addEventListener("change", handleDarkModeChange);
fields.photoUpload.addEventListener("change", handlePhotoUpload);

hydrateForm();
renderDynamicEditors();
renderStep();
renderPreview();

function loadState() {
  const savedState = localStorage.getItem(STORAGE_KEY);

  if (!savedState) {
    return cloneState(defaultState);
  }

  try {
    return mergeState(cloneState(defaultState), JSON.parse(savedState));
  } catch (error) {
    console.warn("Could not load saved portfolio data.", error);
    return cloneState(defaultState);
  }
}

function mergeState(base, saved) {
  return {
    ...base,
    ...saved,
    personal: { ...base.personal, ...saved.personal },
    education: { ...base.education, ...saved.education },
    socials: { ...base.socials, ...saved.socials },
    skills: Array.isArray(saved.skills) && saved.skills.length ? saved.skills : base.skills,
    projects: Array.isArray(saved.projects) && saved.projects.length ? saved.projects : base.projects
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Keep form controls synchronized with restored localStorage data.
function hydrateForm() {
  fields.fullName.value = state.personal.fullName;
  fields.email.value = state.personal.email;
  fields.phone.value = state.personal.phone;
  fields.bio.value = state.personal.bio;
  fields.college.value = state.education.college;
  fields.degree.value = state.education.degree;
  fields.gradYear.value = state.education.gradYear;
  fields.github.value = state.socials.github;
  fields.linkedin.value = state.socials.linkedin;
  fields.portfolioUrl.value = state.socials.portfolioUrl;
  fields.themeSelect.value = state.theme;
  fields.darkModeToggle.checked = state.darkMode;
  document.body.classList.toggle("dark-app", state.darkMode);
}

function handleFormInput(event) {
  const { id, value } = event.target;

  if (id in state.personal) {
    state.personal[id] = value;
  }

  if (id in state.education) {
    state.education[id] = value;
  }

  if (id in state.socials) {
    state.socials[id] = value;
  }

  saveAndRender();
}

function handleThemeChange(event) {
  state.theme = event.target.value;
  saveAndRender();
}

function handleDarkModeChange(event) {
  state.darkMode = event.target.checked;
  document.body.classList.toggle("dark-app", state.darkMode);
  saveState();
}

function handlePhotoUpload(event) {
  const file = event.target.files[0];

  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    state.personal.photo = reader.result;
    saveAndRender();
  });
  reader.readAsDataURL(file);
}

// Dynamic editors are re-rendered after add/remove so indices stay accurate.
function renderDynamicEditors() {
  renderSkillsEditor();
  renderProjectsEditor();
}

function renderSkillsEditor() {
  skillsList.innerHTML = state.skills
    .map(
      (skill, index) => `
        <div class="dynamic-row" data-skill-index="${index}">
          <label>
            <span>Skill Name</span>
            <input type="text" value="${escapeAttribute(skill.name)}" data-action="skill-name" placeholder="React, Python, UI Design" />
          </label>
          <label>
            <span>Level</span>
            <input type="number" min="0" max="100" value="${escapeAttribute(skill.level)}" data-action="skill-level" />
          </label>
          <button class="remove-btn" type="button" data-action="remove-skill" aria-label="Remove skill">X</button>
        </div>
      `
    )
    .join("");

  skillsList.querySelectorAll("input, button").forEach((element) => {
    element.addEventListener("input", handleSkillChange);
    element.addEventListener("click", handleSkillChange);
  });
}

function renderProjectsEditor() {
  projectsList.innerHTML = state.projects
    .map(
      (project, index) => `
        <div class="project-editor" data-project-index="${index}">
          <label>
            <span>Project Title</span>
            <input type="text" value="${escapeAttribute(project.title)}" data-action="project-title" placeholder="Portfolio Generator" />
          </label>
          <label>
            <span>Project Description</span>
            <textarea rows="4" data-action="project-description" placeholder="Describe the goal, tech, and outcome.">${escapeHtml(project.description)}</textarea>
          </label>
          <label>
            <span>Project Link</span>
            <input type="url" value="${escapeAttribute(project.link)}" data-action="project-link" placeholder="https://example.com" />
          </label>
          <button class="remove-btn" type="button" data-action="remove-project">Remove Project</button>
        </div>
      `
    )
    .join("");

  projectsList.querySelectorAll("input, textarea, button").forEach((element) => {
    element.addEventListener("input", handleProjectChange);
    element.addEventListener("click", handleProjectChange);
  });
}

// Every editor interaction mutates state, saves it, then refreshes the preview.
function handleSkillChange(event) {
  const row = event.target.closest("[data-skill-index]");

  if (!row) {
    return;
  }

  const index = Number(row.dataset.skillIndex);
  const action = event.target.dataset.action;

  if (action === "remove-skill" && event.type === "click") {
    state.skills.splice(index, 1);
    if (!state.skills.length) addSkill(false);
    renderSkillsEditor();
    saveAndRender();
    return;
  }

  if (event.type !== "input") {
    return;
  }

  if (action === "skill-name") {
    state.skills[index].name = event.target.value;
  }

  if (action === "skill-level") {
    state.skills[index].level = clamp(Number(event.target.value), 0, 100);
  }

  saveAndRender();
}

function handleProjectChange(event) {
  const row = event.target.closest("[data-project-index]");

  if (!row) {
    return;
  }

  const index = Number(row.dataset.projectIndex);
  const action = event.target.dataset.action;

  if (action === "remove-project" && event.type === "click") {
    state.projects.splice(index, 1);
    if (!state.projects.length) addProject(false);
    renderProjectsEditor();
    saveAndRender();
    return;
  }

  if (event.type !== "input") {
    return;
  }

  if (action === "project-title") {
    state.projects[index].title = event.target.value;
  }

  if (action === "project-description") {
    state.projects[index].description = event.target.value;
  }

  if (action === "project-link") {
    state.projects[index].link = event.target.value;
  }

  saveAndRender();
}

function addSkill(shouldRender = true) {
  state.skills.push({ name: "", level: 70 });

  if (shouldRender) {
    renderSkillsEditor();
    saveAndRender();
  }
}

function addProject(shouldRender = true) {
  state.projects.push({ title: "", description: "", link: "" });

  if (shouldRender) {
    renderProjectsEditor();
    saveAndRender();
  }
}

function changeStep(nextStep) {
  state.currentStep = clamp(nextStep, 0, stepPanels.length - 1);
  saveState();
  renderStep();
}

function renderStep() {
  stepTabs.forEach((tab) => {
    tab.classList.toggle("active", Number(tab.dataset.step) === state.currentStep);
  });

  stepPanels.forEach((panel) => {
    panel.classList.toggle("active", Number(panel.dataset.stepPanel) === state.currentStep);
  });
}

function saveAndRender() {
  saveState();
  renderPreview();
}

function renderPreview() {
  preview.innerHTML = buildPortfolioHtml(state);
}

// The live preview and exported HTML share the same template literal output.
function buildPortfolioHtml(data) {
  const name = escapeHtml(data.personal.fullName || "Your Name");
  const initials = getInitials(data.personal.fullName);
  const bio = escapeHtml(data.personal.bio || "Add a short bio to introduce your academic journey, technical interests, and the kind of work you enjoy building.");
  const email = escapeHtml(data.personal.email || "your.email@example.com");
  const phone = escapeHtml(data.personal.phone || "+91 00000 00000");
  const college = escapeHtml(data.education.college || "College Name");
  const degree = escapeHtml(data.education.degree || "Degree Program");
  const gradYear = escapeHtml(data.education.gradYear || "Graduation Year");

  const heroPhoto = data.personal.photo
    ? `<img class="profile-photo" src="${data.personal.photo}" alt="${name} profile photo" />`
    : `<div class="profile-photo photo-placeholder" aria-label="Profile initials">${initials}</div>`;

  const skills = data.skills
    .filter((skill) => skill.name.trim())
    .map(
      (skill) => `
        <article class="skill-card">
          <strong>${escapeHtml(skill.name)}</strong>
          <div class="progress-track" aria-label="${escapeAttribute(skill.name)} skill level">
            <div class="progress-fill" style="width: ${clamp(Number(skill.level) || 0, 0, 100)}%"></div>
          </div>
        </article>
      `
    )
    .join("");

  const projects = data.projects
    .filter((project) => project.title.trim() || project.description.trim() || project.link.trim())
    .map(
      (project) => `
        <article class="project-card">
          <h4>${escapeHtml(project.title || "Untitled Project")}</h4>
          <p>${escapeHtml(project.description || "Project details will appear here.")}</p>
          ${project.link ? `<a href="${escapeAttribute(normalizeUrl(project.link))}" target="_blank" rel="noopener noreferrer">View Project</a>` : ""}
        </article>
      `
    )
    .join("");

  const contactItems = [
    ["Email", `mailto:${data.personal.email}`, data.personal.email],
    ["Phone", `tel:${data.personal.phone}`, data.personal.phone],
    ["GitHub", data.socials.github, data.socials.github],
    ["LinkedIn", data.socials.linkedin, data.socials.linkedin],
    ["Portfolio", data.socials.portfolioUrl, data.socials.portfolioUrl]
  ]
    .filter(([, , value]) => value)
    .map(
      ([label, href, value]) => `
        <div class="contact-item">
          <span>${escapeHtml(label)}</span>
          <a href="${escapeAttribute(normalizeContactHref(href, label))}" target="_blank" rel="noopener noreferrer">${escapeHtml(value)}</a>
        </div>
      `
    )
    .join("");

  return `
    <article class="portfolio theme-${data.theme}">
      <section class="generated-hero">
        <div class="hero-copy">
          <h2>${name}</h2>
          <p>${bio}</p>
          <div class="hero-meta">
            <span>${degree}</span>
            <span>${college}</span>
            <span>Class of ${gradYear}</span>
          </div>
        </div>
        ${heroPhoto}
      </section>

      <section class="portfolio-section">
        <h3>About Me</h3>
        <p>${bio}</p>
      </section>

      <section class="portfolio-section">
        <h3>Education</h3>
        <article class="education-card">
          <strong>${degree}</strong>
          <p>${college} - ${gradYear}</p>
        </article>
      </section>

      <section class="portfolio-section">
        <h3>Skills</h3>
        <div class="skills-grid">${skills || `<span class="skill-pill">Add skills to populate this section</span>`}</div>
      </section>

      <section class="portfolio-section">
        <h3>Projects</h3>
        <div class="projects-grid">${projects || `<p>Add project details to create polished project cards.</p>`}</div>
      </section>

      <section class="portfolio-section">
        <h3>Contact</h3>
        <div class="contact-grid">
          ${contactItems || `<div class="contact-item"><span>Email</span><a href="mailto:${email}">${email}</a></div><div class="contact-item"><span>Phone</span><a href="tel:${phone}">${phone}</a></div>`}
        </div>
      </section>
    </article>
  `;
}

function downloadPortfolioHtml() {
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(state.personal.fullName || "Student Portfolio")}</title>
    <style>${getExportCss()}</style>
  </head>
  <body>
    ${buildPortfolioHtml(state)}
  </body>
</html>`;

  downloadBlob(html, `${slugify(state.personal.fullName || "student")}-portfolio.html`, "text/html");
}

function downloadResumePdf() {
  const jsPdfNamespace = window.jspdf;

  if (!jsPdfNamespace || !jsPdfNamespace.jsPDF) {
    alert("jsPDF could not be loaded. Check your internet connection and try again.");
    return;
  }

  const doc = new jsPdfNamespace.jsPDF();
  const margin = 18;
  let y = 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(state.personal.fullName || "Student Resume", margin, y);

  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text([state.personal.email, state.personal.phone, state.socials.linkedin].filter(Boolean).join(" | "), margin, y);

  y += 14;
  y = writePdfSection(doc, "About", state.personal.bio || "Add a short bio to complete this section.", margin, y);
  y = writePdfSection(
    doc,
    "Education",
    `${state.education.degree || "Degree"}\n${state.education.college || "College"} - ${state.education.gradYear || "Graduation Year"}`,
    margin,
    y
  );

  const skillsText = state.skills
    .filter((skill) => skill.name)
    .map((skill) => `${skill.name} (${skill.level}%)`)
    .join(", ");
  y = writePdfSection(doc, "Skills", skillsText || "Add skills to complete this section.", margin, y);

  const projectsText = state.projects
    .filter((project) => project.title || project.description)
    .map((project) => `${project.title || "Untitled Project"}\n${project.description || ""}\n${project.link || ""}`)
    .join("\n\n");
  y = writePdfSection(doc, "Projects", projectsText || "Add project details to complete this section.", margin, y);

  const linksText = [
    state.socials.github && `GitHub: ${state.socials.github}`,
    state.socials.linkedin && `LinkedIn: ${state.socials.linkedin}`,
    state.socials.portfolioUrl && `Portfolio: ${state.socials.portfolioUrl}`
  ]
    .filter(Boolean)
    .join("\n");
  writePdfSection(doc, "Social Links", linksText || "Add social links to complete this section.", margin, y);

  doc.save(`${slugify(state.personal.fullName || "student")}-resume.pdf`);
}

// jsPDF uses manual text wrapping so the resume remains readable on long inputs.
function writePdfSection(doc, title, content, x, y) {
  const pageHeight = doc.internal.pageSize.height;
  const lines = doc.splitTextToSize(content, 174);

  if (y + 16 > pageHeight - 18) {
    doc.addPage();
    y = 20;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(title, x, y);

  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);

  lines.forEach((line) => {
    if (y > pageHeight - 18) {
      doc.addPage();
      y = 20;
    }

    doc.text(line, x, y);
    y += 6;
  });

  return y + 7;
}

function resetForm() {
  if (!confirm("Reset the full portfolio form?")) {
    return;
  }

  state = cloneState(defaultState);
  localStorage.removeItem(STORAGE_KEY);
  fields.photoUpload.value = "";
  hydrateForm();
  renderDynamicEditors();
  renderStep();
  renderPreview();
}

// These styles are embedded into the downloaded HTML to make it standalone.
function getExportCss() {
  return `
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Inter, Arial, sans-serif; background: #f8fafc; }
    .portfolio { --p-bg: #f8fafc; --p-surface: #fff; --p-text: #172033; --p-muted: #667085; --p-brand: #2563eb; --p-accent: #0f766e; --p-border: #e5eaf0; min-height: 100vh; background: var(--p-bg); color: var(--p-text); }
    .portfolio.theme-dark { --p-bg: #0b1220; --p-surface: #111b2d; --p-text: #f8fafc; --p-muted: #a8b3c5; --p-brand: #60a5fa; --p-accent: #2dd4bf; --p-border: #24334d; }
    .portfolio.theme-minimal { --p-bg: #fff; --p-surface: #fff; --p-text: #161616; --p-muted: #5f6368; --p-brand: #111827; --p-accent: #b45309; --p-border: #dedede; }
    .generated-hero { display: grid; grid-template-columns: 1fr auto; gap: 22px; align-items: center; padding: clamp(28px, 5vw, 52px); background: linear-gradient(135deg, color-mix(in srgb, var(--p-brand) 16%, var(--p-bg)), var(--p-bg)); border-bottom: 1px solid var(--p-border); }
    .hero-copy h2 { margin: 0; font-size: clamp(2rem, 4vw, 3.4rem); line-height: 1.05; letter-spacing: 0; }
    .hero-copy p, .portfolio-section p { color: var(--p-muted); line-height: 1.75; }
    .hero-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
    .hero-meta span, .skill-pill { display: inline-flex; align-items: center; min-height: 34px; padding: 7px 11px; border: 1px solid var(--p-border); border-radius: 999px; background: var(--p-surface); color: var(--p-text); font-size: .88rem; font-weight: 700; }
    .profile-photo { width: clamp(126px, 16vw, 170px); aspect-ratio: 1; border: 5px solid var(--p-surface); border-radius: 50%; object-fit: cover; box-shadow: 0 18px 35px rgba(0,0,0,.16); }
    .photo-placeholder { display: grid; place-items: center; color: #fff; background: linear-gradient(135deg, var(--p-brand), var(--p-accent)); font-size: 2.7rem; font-weight: 900; }
    .portfolio-section { padding: clamp(24px, 4vw, 42px); border-bottom: 1px solid var(--p-border); }
    .portfolio-section h3 { margin: 0 0 14px; font-size: 1.35rem; }
    .education-card, .project-card, .skill-card, .contact-item { border: 1px solid var(--p-border); border-radius: 8px; background: var(--p-surface); padding: 16px; }
    .skills-grid, .projects-grid, .contact-grid { display: grid; gap: 12px; }
    .skills-grid, .projects-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .contact-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .progress-track { height: 9px; overflow: hidden; border-radius: 999px; background: color-mix(in srgb, var(--p-muted) 18%, transparent); }
    .progress-fill { height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--p-brand), var(--p-accent)); }
    a { color: var(--p-brand); font-weight: 800; text-decoration: none; overflow-wrap: anywhere; }
    @media (max-width: 720px) { .generated-hero, .skills-grid, .projects-grid, .contact-grid { grid-template-columns: 1fr; } .profile-photo { width: 132px; } }
  `;
}

function cloneState(value) {
  return JSON.parse(JSON.stringify(value));
}

function downloadBlob(content, fileName, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function normalizeUrl(url) {
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function normalizeContactHref(href, label) {
  if (label === "Email") return href;
  if (label === "Phone") return href.replace(/\s/g, "");
  return normalizeUrl(href);
}

function getInitials(name) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "SP";
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}