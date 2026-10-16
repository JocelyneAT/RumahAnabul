// Page rendering and routing. Pages: #/ (browse), #/dog/<id>, #/post, #/me (dashboard), #/login
const app = document.getElementById("app");
const esc = escapeHTML;
let currentUser = null;
let nextRoute = null; // where to go after logging in
const filters = { q: "", province: "", size: "", age: "", sex: "" };

/* ---------- helpers ---------- */

function go(hash) {
  if (location.hash === hash) router();
  else location.hash = hash;
}

function options(values, labelPrefix, selected, placeholder) {
  const first = placeholder ? `<option value="">${esc(placeholder)}</option>` : "";
  return first + values
    .map((v) => `<option value="${esc(v)}"${v === selected ? " selected" : ""}>${labelPrefix ? t(labelPrefix + v) : esc(v)}</option>`)
    .join("");
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(lang === "id" ? "id-ID" : "en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// Dogs without a photo get the logo on one of a few warm tints from the palette
const PLACEHOLDER_TINTS = ["tint-1", "tint-2", "tint-3", "tint-4"];

function photoHTML(dog) {
  if (dog.photo_url) return `<img src="${esc(dog.photo_url)}" alt="${t("dog.photoOf", { name: dog.name })}" loading="lazy" />`;
  const n = [...String(dog.id)].reduce((sum, c) => sum + c.charCodeAt(0), 0);
  return `<div class="placeholder ${PLACEHOLDER_TINTS[n % PLACEHOLDER_TINTS.length]}">${logoSVG()}</div>`;
}

const PIN_ICON = `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"/></svg>`;

// Turns 0812-3456-789 into a wa.me link with Indonesia's country code.
function waLink(phone) {
  let digits = String(phone).replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  return `https://wa.me/${digits}`;
}

let toastTimer;
function toast(message, isError = false) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.classList.toggle("toast-error", isError);
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), 4500);
}

// Disables the button while saving and shows any error under the form.
async function submitWith(form, errorEl, action) {
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  errorEl.hidden = true;
  try {
    await action();
  } catch (err) {
    errorEl.textContent = err.message || t("error.generic");
    errorEl.hidden = false;
    button.disabled = false;
  }
}

function requireLogin() {
  if (currentUser) return true;
  nextRoute = location.hash;
  go("#/login");
  return false;
}

/* ---------- layout ---------- */

function renderChrome() {
  const nav = document.getElementById("nav-links");
  nav.innerHTML = `
    <a href="#/">${t("nav.browse")}</a>
    <a href="#/post">${t("nav.post")}</a>
    ${currentUser
      ? `<a href="#/me">${t("nav.dashboard")}</a><button type="button" class="link-btn" id="logout-btn">${t("nav.logout")}</button>`
      : `<a href="#/login" class="btn btn-small">${t("nav.login")}</a>`}
    <button type="button" class="lang-btn" id="lang-btn" aria-label="${t("nav.langLabel")}">${lang === "id" ? "EN" : "ID"}</button>`;

  document.getElementById("lang-btn").onclick = () => {
    setLang(lang === "id" ? "en" : "id");
    router();
  };
  const logout = document.getElementById("logout-btn");
  if (logout) logout.onclick = async () => {
    await api.signOut();
    go("#/");
  };

  const banner = document.getElementById("demo-banner");
  banner.hidden = !api.isDemo;
  banner.textContent = t("demo.banner");
  document.getElementById("footer-text").textContent = t("footer");
}

/* ---------- browse ---------- */

function dogCard(dog) {
  return `
    <a class="dog-card" href="#/dog/${encodeURIComponent(dog.id)}">
      <div class="dog-photo">
        ${photoHTML(dog)}
        ${dog.status === "reserved" ? `<span class="badge">${t("status.reserved")}</span>` : ""}
      </div>
      <div class="dog-info">
        <h3>${esc(dog.name)}</h3>
        <p class="muted">${esc(dog.breed || t("dog.mixed"))}</p>
        <p class="location">${PIN_ICON}${esc(dog.city)}, ${esc(dog.province)}</p>
        <div class="tags">
          <span class="tag">${t("age." + dog.age_group)}</span>
          <span class="tag">${t("size." + dog.size)}</span>
          <span class="tag">${t("sex." + dog.sex)}</span>
        </div>
        <p class="reason">${t("reason." + dog.reason)}</p>
      </div>
    </a>`;
}

function stepsHTML(prefix) {
  return [1, 2, 3].map((i) => `<li><strong>${t(prefix + i + "t")}</strong><span>${t(prefix + i)}</span></li>`).join("");
}

async function viewBrowse() {
  const dogs = (await api.listDogs()).filter((d) => d.status !== "adopted");

  app.innerHTML = `
    <section class="hero">
      <div class="container hero-inner">
        <div class="hero-copy">
          <p class="hero-kicker">${t("hero.kicker")}</p>
          <h1>${t("hero.title")}</h1>
          <p class="hero-sub">${t("hero.sub")}</p>
          <div class="hero-actions">
            <button type="button" class="btn btn-dark" id="scroll-dogs">${t("hero.ctaAdopt")}</button>
            <a href="#/post" class="btn btn-outline-dark">${t("hero.ctaRehome")}</a>
          </div>
        </div>
        <div class="hero-art" aria-hidden="true">${logoSVG()}</div>
      </div>
    </section>

    <section class="container section" id="dogs">
      <h2>${t("browse.title")}</h2>
      <div class="filters">
        <input type="search" id="f-q" placeholder="${t("browse.search")}" value="${esc(filters.q)}" />
        <select id="f-province">${options(PROVINCES, null, filters.province, t("browse.anyProvince"))}</select>
        <select id="f-size">${options(SIZES, "size.", filters.size, t("browse.anySize"))}</select>
        <select id="f-age">${options(AGE_GROUPS, "age.", filters.age, t("browse.anyAge"))}</select>
        <select id="f-sex">${options(SEXES, "sex.", filters.sex, t("browse.anySex"))}</select>
      </div>
      <p class="muted" id="result-count"></p>
      <div class="dog-grid" id="dog-grid"></div>
    </section>

    <section class="section band">
      <div class="container">
        <h2>${t("how.title")}</h2>
        <div class="how-grid">
          <div><h3>${t("how.ownerTitle")}</h3><ol class="steps">${stepsHTML("how.owner")}</ol></div>
          <div><h3>${t("how.adopterTitle")}</h3><ol class="steps">${stepsHTML("how.adopter")}</ol></div>
        </div>
      </div>
    </section>

    <section class="container section">
      <h2>${t("rules.title")}</h2>
      <ul class="rules">
        ${[1, 2, 3, 4].map((i) => `<li><strong>${t("rules." + i + "t")}</strong><span>${t("rules." + i)}</span></li>`).join("")}
      </ul>
    </section>`;

  document.getElementById("scroll-dogs").onclick = () =>
    document.getElementById("dogs").scrollIntoView({ behavior: "smooth" });

  const draw = () => {
    const q = filters.q.trim().toLowerCase();
    const list = dogs.filter(
      (d) =>
        (!q || [d.name, d.breed, d.city].some((v) => (v || "").toLowerCase().includes(q))) &&
        (!filters.province || d.province === filters.province) &&
        (!filters.size || d.size === filters.size) &&
        (!filters.age || d.age_group === filters.age) &&
        (!filters.sex || d.sex === filters.sex)
    );
    document.getElementById("result-count").textContent = t("browse.count", { n: list.length });
    document.getElementById("dog-grid").innerHTML = list.length
      ? list.map(dogCard).join("")
      : dogs.length
        ? `<p class="empty">${t("browse.empty")}</p>`
        : `<div class="empty">${logoSVG()}<p>${t("browse.none")}</p><a href="#/post" class="btn">${t("hero.ctaRehome")}</a></div>`;
  };

  const inputs = { q: "f-q", province: "f-province", size: "f-size", age: "f-age", sex: "f-sex" };
  for (const [key, id] of Object.entries(inputs)) {
    document.getElementById(id).addEventListener("input", (e) => {
      filters[key] = e.target.value;
      draw();
    });
  }
  draw();
}

/* ---------- dog detail + apply ---------- */

function applyFormHTML(dog) {
  return `
    <form id="apply-form" class="card form">
      <h2>${t("apply.title", { name: dog.name })}</h2>
      <p class="muted">${t("apply.intro")}</p>
      <div class="form-row">
        <label>${t("apply.name")}<input id="ap-name" required maxlength="60" value="${esc(currentUser.name)}" /></label>
        <label>${t("apply.phone")}<input id="ap-phone" type="tel" required maxlength="20" placeholder="0812 3456 7890" /></label>
      </div>
      <div class="form-row">
        <label>${t("apply.city")}<input id="ap-city" required maxlength="60" /></label>
        <label>${t("apply.home")}<select id="ap-home" required>${options(HOME_TYPES, "home.", null, t("form.choose"))}</select></label>
      </div>
      <label class="check"><input type="checkbox" id="ap-yard" /> ${t("apply.yard")}</label>
      <label>${t("apply.experience")}<textarea id="ap-exp" rows="3" required maxlength="1000" placeholder="${t("apply.experienceHint")}"></textarea></label>
      <label>${t("apply.pets")}<input id="ap-pets" maxlength="100" placeholder="${t("apply.petsHint")}" /></label>
      <label>${t("apply.message")}<textarea id="ap-msg" rows="3" maxlength="1000" placeholder="${t("apply.messageHint")}"></textarea></label>
      <label class="check pledge"><input type="checkbox" id="ap-pledge" required /> ${t("apply.pledge")}</label>
      <button class="btn btn-full" type="submit">${t("apply.submit")}</button>
      <p class="error" id="ap-error" hidden></p>
    </form>`;
}

async function viewDog(id) {
  const dog = await api.getDog(id);
  if (!dog) {
    app.innerHTML = `<div class="container section"><h2>${t("dog.notFound")}</h2><a href="#/" class="btn">${t("nav.browse")}</a></div>`;
    return;
  }

  const isOwner = currentUser?.id === dog.owner_id;
  let applyArea;
  if (dog.status === "adopted") {
    applyArea = `<div class="notice">${t("dog.adoptedNotice")}</div>`;
  } else if (isOwner) {
    applyArea = `<div class="notice">${t("dog.yourDog")} <a href="#/me" class="btn btn-small">${t("nav.dashboard")}</a></div>`;
  } else if (!currentUser) {
    applyArea = `<div class="notice">${t("dog.loginToApply")} <a href="#/login" class="btn btn-small" data-next="#/dog/${esc(dog.id)}">${t("nav.login")}</a></div>`;
  } else {
    const existing = (await api.myApplications()).find((a) => a.dog_id === dog.id);
    if (existing) {
      applyArea = `<div class="notice">${t("dog.alreadyApplied")} <span class="status status-${esc(existing.status)}">${t("status." + existing.status)}</span></div>`;
    } else if (dog.status === "reserved") {
      applyArea = `<div class="notice">${t("dog.reservedNotice")}</div>`;
    } else {
      applyArea = applyFormHTML(dog);
    }
  }

  const goodWith = dog.good_with?.length ? dog.good_with.map((g) => t("good." + g)).join(", ") : t("dog.askOwner");

  app.innerHTML = `
    <div class="container section">
      <a href="#/" class="back">← ${t("dog.back")}</a>
      <div class="detail">
        <div class="dog-photo detail-photo">${photoHTML(dog)}</div>
        <div class="detail-body">
          <p class="eyebrow">${esc(dog.city)}, ${esc(dog.province)}</p>
          <h1>${esc(dog.name)}
            ${dog.status !== "available" ? `<span class="status status-${esc(dog.status)}">${t("status." + dog.status)}</span>` : ""}
          </h1>
          <p class="muted">${esc(dog.breed || t("dog.mixed"))} · ${esc(dog.age_text) || t("age." + dog.age_group)} · ${t("size." + dog.size)} · ${t("sex." + dog.sex)}</p>
          <div class="reason-box"><strong>${t("dog.whyRehome")}</strong> ${t("reason." + dog.reason)}</div>
          <h3>${t("dog.story", { owner: dog.owner_name })}</h3>
          <p class="story">${esc(dog.story)}</p>
          <ul class="facts">
            <li><span class="${dog.vaccinated ? "yes" : "no"}">${dog.vaccinated ? "✓" : "✗"}</span> ${t("dog.vaccinated")}</li>
            <li><span class="${dog.sterilized ? "yes" : "no"}">${dog.sterilized ? "✓" : "✗"}</span> ${t("dog.sterilized")}</li>
            <li>${t("dog.goodWith")}: ${goodWith}</li>
          </ul>
          <p class="muted small">${t("dog.posted", { date: formatDate(dog.created_at) })}</p>
        </div>
      </div>
      <div class="apply-area">${applyArea}</div>
    </div>`;

  const form = document.getElementById("apply-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      submitWith(form, document.getElementById("ap-error"), async () => {
        const val = (id) => document.getElementById(id).value.trim();
        await api.createApplication(dog.id, {
          applicant_name: val("ap-name"),
          phone: val("ap-phone"),
          city: val("ap-city"),
          home_type: val("ap-home"),
          has_yard: document.getElementById("ap-yard").checked,
          experience: val("ap-exp"),
          other_pets: val("ap-pets"),
          message: val("ap-msg"),
        });
        toast(t("apply.sent"));
        router();
      });
    });
  }
}

/* ---------- post a dog ---------- */

function viewPost() {
  app.innerHTML = `
    <div class="container section narrow">
      <h1>${t("post.title")}</h1>
      <p class="muted">${t("post.intro")}</p>
      <form id="post-form" class="card form">
        <h3 class="form-section">${t("post.aboutDog")}</h3>
        <div class="form-row">
          <label>${t("post.name")}<input id="p-name" required maxlength="40" /></label>
          <label>${t("post.breed")}<input id="p-breed" maxlength="60" placeholder="${t("post.breedHint")}" /></label>
        </div>
        <div class="form-row three">
          <label>${t("post.age")}<select id="p-age" required>${options(AGE_GROUPS, "age.", null, t("form.choose"))}</select></label>
          <label>${t("post.size")}<select id="p-size" required>${options(SIZES, "size.", null, t("form.choose"))}</select></label>
          <label>${t("post.sex")}<select id="p-sex" required>${options(SEXES, "sex.", null, t("form.choose"))}</select></label>
        </div>
        <label>${t("post.ageText")}<input id="p-agetext" maxlength="30" placeholder="${t("post.ageTextHint")}" /></label>
        <label>${t("post.photo")}<input id="p-photo" type="file" accept="image/*" required /></label>
        <img id="p-preview" class="preview" hidden alt="" />
        <fieldset>
          <legend>${t("post.health")}</legend>
          <label class="check"><input type="checkbox" id="p-vacc" /> ${t("dog.vaccinated")}</label>
          <label class="check"><input type="checkbox" id="p-steril" /> ${t("dog.sterilized")}</label>
        </fieldset>
        <fieldset>
          <legend>${t("dog.goodWith")}</legend>
          ${GOOD_WITH.map((g) => `<label class="check"><input type="checkbox" id="p-good-${g}" value="${g}" /> ${t("good." + g)}</label>`).join("")}
        </fieldset>

        <h3 class="form-section">${t("post.whereWhy")}</h3>
        <div class="form-row">
          <label>${t("post.province")}<select id="p-province" required>${options(PROVINCES, null, null, t("form.choose"))}</select></label>
          <label>${t("post.city")}<input id="p-city" required maxlength="60" placeholder="${t("post.cityHint")}" /></label>
        </div>
        <label>${t("post.reason")}<select id="p-reason" required>${options(REASONS, "reason.", null, t("form.choose"))}</select></label>
        <label>${t("post.story")}<textarea id="p-story" rows="6" required maxlength="2000" placeholder="${t("post.storyHint")}"></textarea></label>
        <label class="check pledge"><input type="checkbox" id="p-pledge" required /> ${t("post.pledge")}</label>
        <button class="btn btn-full" type="submit">${t("post.submit")}</button>
        <p class="error" id="p-error" hidden></p>
      </form>
    </div>`;

  const photoInput = document.getElementById("p-photo");
  const preview = document.getElementById("p-preview");
  photoInput.addEventListener("change", () => {
    const file = photoInput.files[0];
    preview.hidden = !file;
    if (file) preview.src = URL.createObjectURL(file);
  });

  const form = document.getElementById("post-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    submitWith(form, document.getElementById("p-error"), async () => {
      button.textContent = t("post.saving");
      const val = (id) => document.getElementById(id).value.trim();
      try {
        const dog = await api.createDog(
          {
            name: val("p-name"),
            breed: val("p-breed"),
            age_group: val("p-age"),
            age_text: val("p-agetext"),
            size: val("p-size"),
            sex: val("p-sex"),
            province: val("p-province"),
            city: val("p-city"),
            reason: val("p-reason"),
            story: val("p-story"),
            vaccinated: document.getElementById("p-vacc").checked,
            sterilized: document.getElementById("p-steril").checked,
            good_with: GOOD_WITH.filter((g) => document.getElementById("p-good-" + g).checked),
          },
          photoInput.files[0]
        );
        toast(t("post.done"));
        go("#/dog/" + encodeURIComponent(dog.id));
      } finally {
        button.textContent = t("post.submit");
      }
    });
  });
}

/* ---------- dashboard ---------- */

function applicationHTML(a) {
  return `
    <div class="application" data-app="${esc(a.id)}">
      <div class="application-head">
        <strong>${esc(a.applicant_name)}</strong>
        <span class="status status-${esc(a.status)}">${t("status." + a.status)}</span>
      </div>
      <dl class="app-facts">
        <dt>${t("apply.city")}</dt><dd>${esc(a.city)}</dd>
        <dt>${t("apply.home")}</dt><dd>${t("home." + a.home_type)}${a.has_yard ? " · " + t("dash.hasYard") : ""}</dd>
        <dt>${t("apply.pets")}</dt><dd>${esc(a.other_pets || "-")}</dd>
        <dt>${t("apply.experience")}</dt><dd>${esc(a.experience)}</dd>
        ${a.message ? `<dt>${t("apply.message")}</dt><dd>${esc(a.message)}</dd>` : ""}
        <dt>WhatsApp</dt><dd>${esc(a.phone)}</dd>
      </dl>
      <div class="app-actions">
        ${a.status === "pending"
          ? `<button type="button" class="btn btn-small" data-action="accept">${t("dash.accept")}</button>
             <button type="button" class="btn btn-small btn-outline" data-action="decline">${t("dash.decline")}</button>`
          : ""}
        ${a.status !== "declined" ? `<a class="btn btn-small btn-wa" href="${waLink(a.phone)}" target="_blank" rel="noopener">${t("dash.chat")}</a>` : ""}
        <span class="muted small">${t("dash.appliedOn", { date: formatDate(a.created_at) })}</span>
      </div>
    </div>`;
}

function ownerDogHTML(dog, applications) {
  return `
    <article class="owner-dog card" data-dog="${esc(dog.id)}">
      <div class="owner-dog-head">
        <div class="thumb">${photoHTML(dog)}</div>
        <div class="owner-dog-info">
          <h3><a href="#/dog/${encodeURIComponent(dog.id)}">${esc(dog.name)}</a></h3>
          <p class="muted small">${esc(dog.city)} · ${t("dash.appCount", { n: applications.length })}</p>
        </div>
        <div class="owner-dog-actions">
          <label class="sr-only" for="st-${esc(dog.id)}">${t("dash.status")}</label>
          <select id="st-${esc(dog.id)}" data-action="dog-status">${options(DOG_STATUSES, "status.", dog.status)}</select>
          <button type="button" class="link-btn danger" data-action="dog-delete">${t("dash.delete")}</button>
        </div>
      </div>
      ${applications.length
        ? `<div class="apps">${applications.map(applicationHTML).join("")}</div>`
        : `<p class="muted small">${t("dash.noAppsYet")}</p>`}
    </article>`;
}

function myApplicationHTML(a) {
  return `
    <li class="my-app">
      <div class="my-app-row">
        <a href="#/dog/${encodeURIComponent(a.dog_id)}">${a.dog_name ? esc(a.dog_name) : t("dash.removedDog")}</a>
        <span class="status status-${esc(a.status)}">${t("status." + a.status)}</span>
        <span class="muted small">${formatDate(a.created_at)}</span>
      </div>
      ${a.status === "accepted" ? `<p class="small">${t("dash.acceptedNote")}</p>` : ""}
    </li>`;
}

async function viewDashboard() {
  const [dogs, applications, mine] = await Promise.all([api.myDogs(), api.applicationsForMyDogs(), api.myApplications()]);

  app.innerHTML = `
    <div class="container section">
      <h1>${t("dash.hello", { name: currentUser.name })}</h1>

      <section class="dash-section">
        <div class="section-head">
          <h2>${t("dash.myDogs")}</h2>
          <a href="#/post" class="btn btn-small">${t("nav.post")}</a>
        </div>
        ${dogs.length
          ? dogs.map((d) => ownerDogHTML(d, applications.filter((a) => a.dog_id === d.id))).join("")
          : `<p class="empty-box">${t("dash.noDogs")}</p>`}
      </section>

      <section class="dash-section">
        <h2>${t("dash.myApps")}</h2>
        ${mine.length
          ? `<ul class="my-apps">${mine.map(myApplicationHTML).join("")}</ul>`
          : `<p class="empty-box">${t("dash.noApps")} <a href="#/">${t("nav.browse")}</a></p>`}
      </section>
    </div>`;

  app.onchange = async (e) => {
    if (e.target.dataset.action !== "dog-status") return;
    try {
      await api.updateDogStatus(e.target.closest("[data-dog]").dataset.dog, e.target.value);
      router();
    } catch (err) {
      toast(err.message, true);
    }
  };

  app.onclick = async (e) => {
    const button = e.target.closest("button[data-action]");
    if (!button) return;
    const dogId = button.closest("[data-dog]").dataset.dog;
    try {
      if (button.dataset.action === "dog-delete") {
        // Two clicks to delete, so nobody removes a dog by accident
        if (!button.dataset.confirm) {
          button.dataset.confirm = "1";
          button.textContent = t("dash.confirmDelete");
          return;
        }
        await api.deleteDog(dogId);
      } else {
        const accepted = button.dataset.action === "accept";
        button.disabled = true;
        await api.setApplicationStatus(button.closest("[data-app]").dataset.app, accepted ? "accepted" : "declined");
        // Accepting someone pauses new applications for that dog
        if (accepted && dogs.find((d) => d.id === dogId)?.status === "available") {
          await api.updateDogStatus(dogId, "reserved");
        }
      }
      router();
    } catch (err) {
      toast(err.message, true);
      button.disabled = false;
    }
  };
}

/* ---------- login / sign up ---------- */

function viewLogin(mode = "login") {
  if (currentUser) {
    go("#/me");
    return;
  }
  const signup = mode === "signup";

  app.innerHTML = `
    <div class="container section narrow-sm">
      <div class="card form">
        <div class="tabs">
          <button type="button" class="tab${signup ? "" : " active"}" data-mode="login">${t("auth.login")}</button>
          <button type="button" class="tab${signup ? " active" : ""}" data-mode="signup">${t("auth.signup")}</button>
        </div>
        <form id="auth-form" class="form">
          ${signup ? `<label>${t("auth.name")}<input id="au-name" required maxlength="40" autocomplete="name" /></label>` : ""}
          <label>${t("auth.email")}<input id="au-email" type="email" required autocomplete="email" /></label>
          <label>${t("auth.password")}<input id="au-pass" type="password" required minlength="6"
            autocomplete="${signup ? "new-password" : "current-password"}" /></label>
          <button class="btn btn-full" type="submit">${signup ? t("auth.signup") : t("auth.login")}</button>
          <p class="error" id="au-error" hidden></p>
          <p class="success" id="au-info" hidden></p>
        </form>
        ${api.isDemo ? `<p class="muted small">${t("auth.demoNote")}</p>` : ""}
      </div>
    </div>`;

  app.querySelectorAll(".tab").forEach((tab) => (tab.onclick = () => viewLogin(tab.dataset.mode)));

  const form = document.getElementById("auth-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    submitWith(form, document.getElementById("au-error"), async () => {
      const email = document.getElementById("au-email").value;
      const password = document.getElementById("au-pass").value;
      if (signup) {
        const { needsConfirm } = await api.signUp({ name: document.getElementById("au-name").value, email, password });
        if (needsConfirm) {
          const info = document.getElementById("au-info");
          info.innerHTML = t("auth.confirmEmail", { email });
          info.hidden = false;
          return;
        }
      } else {
        await api.signIn({ email, password });
      }
      const target = nextRoute || "#/me";
      nextRoute = null;
      go(target);
    });
  });
}

/* ---------- router ---------- */

async function router() {
  // Coming back from the confirmation email: Supabase puts the login (or an error) in the address
  const fromEmail = /^#(access_token|error)=/.test(location.hash);
  const emailParams = fromEmail ? new URLSearchParams(location.hash.slice(1)) : null;

  const [page, id] = location.hash.replace(/^#\/?/, "").split("/");
  app.onclick = null;
  app.onchange = null;
  currentUser = await api.getUser();

  if (fromEmail) {
    history.replaceState(null, "", location.pathname);
    if (emailParams.has("error")) toast(emailParams.get("error_description") || t("error.generic"), true);
    else if (currentUser) toast(t("auth.confirmed"));
  }
  renderChrome();
  window.scrollTo(0, 0);

  try {
    if (page === "dog") await viewDog(decodeURIComponent(id || ""));
    else if (page === "post") requireLogin() && viewPost();
    else if (page === "me") requireLogin() && (await viewDashboard());
    else if (page === "login") viewLogin();
    else await viewBrowse();
  } catch (err) {
    console.error(err);
    app.innerHTML = `<div class="container section"><p class="error">${t("error.generic")} ${esc(err.message)}</p></div>`;
  }
}

document.querySelectorAll("[data-logo]").forEach((el) => (el.outerHTML = logoSVG()));

document.addEventListener("click", (e) => {
  const link = e.target.closest("[data-next]");
  if (link) nextRoute = link.dataset.next;
});
window.addEventListener("hashchange", router);
router();
