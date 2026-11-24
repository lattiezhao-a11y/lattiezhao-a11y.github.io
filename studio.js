const outdoorScene = document.querySelector(".garden");
const indoorScene = document.querySelector(".studio");
const towerEntrance = document.querySelector(".tower-entry");
const screenEntrance = document.querySelector(".screen-entry");
const projectWindow = document.querySelector(".project-window");
const modalReturn = projectWindow.querySelector(".garden-return");
const repoList = document.querySelector(".repo-list");
const repoStatus = document.querySelector(".repo-status");
const musicPlayer = document.querySelector(".music-player");
const gardenSound = document.querySelector(".garden-sound");
const studioGlobe = document.querySelector(".studio-globe");
const studioImage = document.querySelector(".studio-image");
const studioDetails = document.createElement("div");
document.querySelector(".studio-view").append(studioDetails);
const portraitStudio = matchMedia("(max-aspect-ratio: 4/5)");
const studioParticles = document.querySelector(".studio-particles");
const roomMusic = document.querySelector(".room-music");
const defaultSoundtrack = roomMusic.src;
const fallbackSoundtrack = new URL("assets/music/Mii Editor - Mii Maker (Wii U) Music.mp3", document.baseURI).href;
const roomStatus = document.querySelector(".room-status");
const musicStatus = document.querySelector(".music-status");
const projectViews = projectWindow.querySelectorAll("[data-view]");
const githubOwner = "lattiezhao-a11y";
let reposLoaded = false;
let reposLoading = false;
let projectZoom;
let closingProjects = false;
let previewSoundtrack;
let musicStarted = false;
let startMusicOnEntry = false;

function setMusicStatus(message) {
  roomStatus.textContent = message;
  musicStatus.textContent = message;
}

function updateScene(moveFocus) {
  const inside = location.hash === "#studio";
  const changingScene = inside === indoorScene.hidden;
  if (!inside) {
    setMusicStatus("");
  }
  if (!inside && projectWindow.open) {
    projectZoom?.cancel();
    projectWindow.close();
  }
  outdoorScene.hidden = inside;
  indoorScene.hidden = !inside;
  if (moveFocus && changingScene) (inside ? screenEntrance : towerEntrance).focus({ preventScroll: true });
  if (inside && changingScene) {
    if (!musicStarted && startMusicOnEntry) {
      unmuteRoomMusic();
      playRoomMusic();
    }
    openProjects();
  }
}

// Use the entrance click's browser gesture for audio playback.
towerEntrance.addEventListener("click", event => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  location.hash = "studio";
  updateScene(true);
});
window.addEventListener("hashchange", () => updateScene(true));

function animateProp(visual, frames, duration) {
  for (const animation of visual.getAnimations()) animation.cancel();
  visual.animate(reducedMotion.matches ? [
    { opacity: 0 }, { opacity: 1 }, { opacity: 0 },
  ] : frames, { duration: reducedMotion.matches ? 850 : duration, easing: "ease-out" });
}

function sendPlantVisitor(visitor) {
  animateProp(visitor, [
    { opacity: 0, transform: "scale(.45) rotate(-12deg)" },
    { opacity: 1, transform: "translate(-1.5rem, -2rem) rotate(-22deg)", offset: .27 },
    { opacity: 1, transform: "translate(-4rem, -2.75rem) rotate(12deg) scale(.86)", offset: .67 },
    { opacity: 0, transform: "translate(-6rem, -4.5rem) rotate(-16deg) scale(.65)" },
  ], 1750);
}

studioGlobe.addEventListener("click", () => {
  animateProp(studioGlobe.querySelector(".globe-surface"), [
    { opacity: 1, transform: "rotate(0deg)" },
    { opacity: 1, transform: "rotate(360deg)" },
  ], 1350);
});

// Each box uses the pixel coordinates of its room image.
const studioObjects = {
  wide: {
    size: [1672, 941],
    water: [
      [92, 153, 73, 71], [162, 192, 39, 38], [201, 206, 37, 33],
      [209, 291, 35, 32], [282, 208, 38, 36], [317, 222, 29, 30],
      [84, 341, 123, 83], [367, 486, 43, 45], [414, 473, 45, 49],
      [594, 502, 60, 61], [1513, 433, 72, 74], [1569, 407, 69, 56],
      [1594, 419, 78, 88], [1521, 537, 89, 80],
    ],
    lamps: [[628, 136, 129, 175], [768, 46, 165, 220], [928, 102, 117, 154]],
    jellyfish: [[1438, 243, 60, 94], [1544, 132, 99, 107], [1602, 219, 62, 91]],
    plants: [[1250, 343, 238, 246], [0, 0, 305, 484], [297, 353, 210, 85], [1497, 580, 175, 241]],
  },
  portrait: {
    size: [992, 1585],
    water: [
      [19, 363, 57, 57], [77, 385, 36, 44], [109, 402, 31, 30], [136, 405, 30, 33],
      [46, 538, 43, 44], [86, 532, 35, 49], [223, 636, 35, 40], [260, 629, 39, 45],
      [261, 742, 71, 71], [819, 894, 158, 153], [715, 1121, 63, 109], [737, 1288, 71, 76],
    ],
    lamps: [[223, 195, 151, 222], [317, 329, 78, 124], [625, 223, 93, 123], [651, 325, 89, 132]],
    jellyfish: [[901, 223, 79, 111], [851, 296, 76, 101], [820, 449, 61, 83], [866, 482, 66, 85]],
    plants: [[623, 588, 210, 215], [0, 142, 224, 297], [0, 1150, 263, 435], [909, 861, 83, 559], [887, 546, 105, 125]],
  },
};

function splashStudioWater(button) {
  const bounds = button.getBoundingClientRect();
  const layer = studioParticles.getBoundingClientRect();
  const x = bounds.left + bounds.width / 2 - layer.left;
  const y = bounds.top + bounds.height / 2 - layer.top;
  const diameter = Math.min(bounds.width, bounds.height);
  const splash = addEffect(studioParticles, "studio-splash", x, y, 580);
  splash.style.setProperty("--splash-size", `${diameter}px`);
  scatter(button, "droplet", 16, diameter * .75 + 18, studioParticles);
}

function studioObjectLayer(atlas, x, y, width, height, className, originalCrop) {
  const layer = document.createElement("canvas");
  layer.className = className;
  layer.setAttribute("aria-hidden", "true");
  layer.width = width;
  layer.height = height;
  const context = layer.getContext("2d");
  if (originalCrop) context.drawImage(studioImage, ...originalCrop, 0, 0, width, height);
  context.drawImage(atlas, x, y, width, height, 0, 0, width, height);
  return layer;
}

const studioObjectVisibility = new IntersectionObserver(entries => {
  for (const entry of entries) entry.target.tabIndex = entry.intersectionRatio >= .12 ? 0 : -1;
}, { root: indoorScene, threshold: .12 });

function addStudioObject(box, size, kind, label, atlas, index) {
  const [x, y, width, height] = box;
  const [artWidth, artHeight] = size;
  const detail = document.createElement("div");
  detail.className = "studio-detail";
  detail.style.left = `${x / artWidth * 100}%`;
  detail.style.top = `${y / artHeight * 100}%`;
  detail.style.width = `${width / artWidth * 100}%`;
  detail.style.height = `${height / artHeight * 100}%`;

  const button = document.createElement("button");
  button.className = `studio-prop studio-detail-control studio-${kind}`;
  button.type = "button";
  button.setAttribute("aria-label", label);
  detail.append(button);
  studioDetails.append(detail);
  studioObjectVisibility.observe(button);

  if (kind === "water-ball") {
    button.addEventListener("click", () => splashStudioWater(button));
    return;
  }

  let visitor;
  if (kind === "plant" && index === 0) {
    visitor = new Image();
    visitor.src = "assets/blue-morpho.webp";
    visitor.alt = "";
    visitor.className = "plant-visitor";
    button.append(visitor);
  }

  const floating = kind === "jellyfish";
  let motion;
  button.addEventListener("click", async () => {
    if (motion) return;
    if (visitor) sendPlantVisitor(visitor);
    if (reducedMotion.matches) {
      button.animate([{ boxShadow: "0 0 22px #b5fff8b0" }, { boxShadow: "none" }], 650);
      return;
    }

    if (!(await atlas.decode().then(() => true, () => false))) return;
    if (motion || !detail.isConnected || indoorScene.hidden) return;
    if (floating && studioImage.naturalWidth !== artWidth) return;
    // Each atlas cell pairs a fixed backdrop with a transparent object cutout.
    const tileX = (index % 3) * 320;
    const tileY = Math.floor(index / 3) * 560;
    const backdrop = studioObjectLayer(atlas, tileX, tileY, width, height, "studio-still", floating ? box : undefined);
    const object = studioObjectLayer(atlas, 960 + tileX, tileY, width, height, "studio-motion");
    object.style.transformOrigin = index === 1 && !floating ? "30% 8%" : "50% 82%";
    detail.prepend(backdrop, object);

    const frames = floating ? [
      { transform: "translateY(0)" },
      { transform: "translateY(-6%)", offset: .25 },
      { transform: "translateY(2.3%)", offset: .57 },
      { transform: "translateY(-1.3%)", offset: .8 },
      { transform: "translateY(0)" },
    ] : [
      { transform: "rotate(0)" },
      { transform: "rotate(2.4deg)", offset: .22 },
      { transform: "rotate(-1.6deg)", offset: .48 },
      { transform: "rotate(.75deg)", offset: .72 },
      { transform: "rotate(0)" },
    ];
    motion = object.animate(
      frames.map(frame => ({ ...frame, easing: "ease-in-out" })),
      floating ? 1950 : 1350,
    );
    await motion.finished.catch(() => {});
    backdrop.remove();
    object.remove();
    motion = undefined;
  });
}

function placeStudioObjects() {
  studioObjectVisibility.disconnect();
  studioDetails.replaceChildren();
  const layout = portraitStudio.matches ? "portrait" : "wide";
  const { size, water, lamps, jellyfish, plants } = studioObjects[layout];
  const atlas = new Image();
  atlas.src = `assets/studio-${layout}-layers.webp`;
  let tile = 0;
  plants.forEach(box => addStudioObject(box, size, "plant", "Gently sway the leaves", atlas, tile++));
  lamps.forEach(box => addStudioObject(box, size, "jellyfish", "Make the jellyfish lamp float", atlas, tile++));
  jellyfish.forEach(box => addStudioObject(box, size, "jellyfish", "Make the jellyfish drift", atlas, tile++));
  water.forEach(box => addStudioObject(box, size, "water-ball", "Splash the water ball"));
}

portraitStudio.addEventListener("change", placeStudioObjects);
placeStudioObjects();

function soundIsOn() {
  return !roomMusic.paused && !roomMusic.muted && roomMusic.volume > 0;
}

function updateMusicPlayer() {
  const audible = soundIsOn();
  const gardenEnabled = musicStarted ? audible : startMusicOnEntry;
  musicPlayer.setAttribute("aria-pressed", String(audible));
  gardenSound.setAttribute("aria-pressed", String(gardenEnabled));
}

for (const event of ["play", "pause", "error", "volumechange"]) roomMusic.addEventListener(event, updateMusicPlayer);

function unmuteRoomMusic() {
  roomMusic.muted = false;
  if (roomMusic.volume === 0) roomMusic.volume = .8;
}

function getFallbackSoundtrack() {
  if (!previewSoundtrack) {
    const segments = globalThis.aeroPreviewAudio;
    if (!Array.isArray(segments) || segments.length !== 11 || segments.filter(Boolean).length !== 11) return fallbackSoundtrack;
    // A Blob URL lets previews play the track without serving an MP3 file.
    const bytes = segments.map(segment => Uint8Array.from(atob(segment), byte => byte.charCodeAt(0)));
    previewSoundtrack = URL.createObjectURL(new Blob(bytes, { type: "audio/mpeg" }));
  }
  return previewSoundtrack;
}

async function playRoomMusic() {
  setMusicStatus("");
  if (roomMusic.src === defaultSoundtrack && roomMusic.error) roomMusic.src = getFallbackSoundtrack();
  if (roomMusic.error) roomMusic.load();
  try {
    await roomMusic.play();
  } catch (error) {
    if (indoorScene.hidden || error.name === "AbortError") return;
    if (roomMusic.src === defaultSoundtrack && (roomMusic.error || error.name === "NotSupportedError")) {
      roomMusic.src = getFallbackSoundtrack();
      return playRoomMusic();
    }
    setMusicStatus(error.name === "NotAllowedError"
      ? "Tap the CD player in the studio to start the music."
      : "Room music could not be loaded.");
  }
}

musicPlayer.addEventListener("click", () => {
  if (soundIsOn()) roomMusic.pause();
  else {
    unmuteRoomMusic();
    if (roomMusic.paused) playRoomMusic();
  }
});

gardenSound.addEventListener("click", () => {
  if (!musicStarted) {
    startMusicOnEntry = !startMusicOnEntry;
    updateMusicPlayer();
    return;
  }
  if (soundIsOn()) roomMusic.muted = true;
  else {
    unmuteRoomMusic();
    if (roomMusic.paused) playRoomMusic();
  }
});

roomMusic.volume = .8;
roomMusic.addEventListener("playing", () => {
  musicStarted = true;
  updateMusicPlayer();
  setMusicStatus("");
});

function addProjectLink(links, value, label) {
  if (!value) return;
  try {
    const url = new URL(value, location.href);
    if (!value.startsWith("#") && url.protocol !== "https:" && url.protocol !== "http:") return;
    const link = document.createElement("a");
    link.href = url.href;
    link.textContent = label;
    links.append(link);
  } catch {
    // Skip incomplete links while editing the portfolio.
  }
}

function renderPortfolio() {
  const about = document.querySelector("#portfolio-about");
  const welcome = document.createElement("div");
  const avatar = document.createElement("img");
  const welcomeText = document.createElement("p");
  welcome.className = "about-card about-welcome sticker-card";
  welcome.dataset.sticker = "butterfly";
  avatar.className = "about-avatar";
  avatar.src = "assets/about-avatar.jpg";
  avatar.alt = "A fox reaching for a blue butterfly";
  avatar.width = 152;
  avatar.height = 152;
  avatar.loading = "lazy";
  welcomeText.textContent = portfolio.welcome;
  welcome.append(avatar, welcomeText);
  about.append(welcome);

  const intro = document.createElement("div");
  const name = document.createElement("h3");
  const role = document.createElement("p");
  const facts = document.createElement("dl");
  intro.className = "about-card about-intro sticker-card";
  intro.dataset.sticker = "clover";
  name.className = "about-name";
  role.className = "about-role";
  name.textContent = portfolio.intro.name;
  role.textContent = portfolio.intro.role;
  for (const fact of portfolio.intro.facts) {
    const term = document.createElement("dt");
    const detail = document.createElement("dd");
    term.textContent = fact.label;
    detail.textContent = fact.text;
    facts.append(term, detail);
  }
  intro.append(name, role, facts);
  about.append(intro);

  const stack = document.createElement("div");
  const stackTitle = document.createElement("h3");
  stack.className = "about-card about-stack sticker-card";
  stack.dataset.sticker = "cube";
  stackTitle.textContent = "Tech Stack";
  stack.append(stackTitle);
  for (const group of portfolio.stack) {
    const row = document.createElement("div");
    const label = document.createElement("span");
    const items = document.createElement("ul");
    row.className = "stack-group";
    label.className = "stack-label";
    label.textContent = group.label;
    items.setAttribute("aria-label", group.label);
    for (const item of group.items) {
      const chip = document.createElement("li");
      chip.textContent = item;
      items.append(chip);
    }
    row.append(label, items);
    stack.append(row);
  }
  about.append(stack);

  const projects = document.querySelector("#portfolio-projects");
  const list = document.createElement("ul");
  list.className = "repo-list featured-projects";
  for (const project of portfolio.projects) {
    const row = document.createElement("li");
    const title = document.createElement("h3");
    const description = document.createElement("p");
    const links = document.createElement("div");
    title.textContent = project.name;
    description.textContent = project.description;
    links.className = "featured-links";
    addProjectLink(links, project.demo, "Open project");
    addProjectLink(links, project.repository, "Source code");
    row.className = "sticker-card";
    row.dataset.sticker = project.sticker ?? "cube";
    row.append(title, description, links);
    list.append(row);
  }
  projects.append(list);
}

for (const view of projectViews) {
  view.addEventListener("click", () => {
    for (const button of projectViews) {
      const active = button === view;
      button.setAttribute("aria-pressed", String(active));
      document.getElementById(button.getAttribute("aria-controls")).hidden = !active;
    }
    document.querySelector(".project-body").scrollTop = 0;
  });
}

renderPortfolio();

function makeRepoRow(repo) {
  const row = document.createElement("li");
  row.className = "sticker-card";
  const link = document.createElement("a");
  link.className = "repo-name";
  link.href = `https://github.com/${githubOwner}/${encodeURIComponent(repo.name)}`;
  link.textContent = repo.name;
  row.append(link);

  if (repo.language || repo.description) {
    const detail = document.createElement("p");
    detail.textContent = [repo.language, repo.description].filter(Boolean).join(" · ");
    row.append(detail);
  }

  if (repo.homepage) {
    try {
      const url = new URL(repo.homepage);
      if (url.protocol === "https:" || url.protocol === "http:") {
        const website = document.createElement("a");
        website.className = "repo-website";
        website.href = url.href;
        website.textContent = "Live project";
        website.setAttribute("aria-label", `Live project: ${repo.name}`);
        row.append(website);
      }
    } catch {
      // A repository homepage can be missing a URL scheme.
    }
  }
  return row;
}

async function loadRepos() {
  if (reposLoading || reposLoaded) return;
  reposLoading = true;
  repoStatus.textContent = "Loading public repositories…";

  try {
    const response = await fetch(`https://api.github.com/users/${githubOwner}/repos?type=owner&sort=pushed&per_page=100`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);
    const repos = await response.json();
    repoList.replaceChildren(...repos.filter(repo => repo.private === false).map(makeRepoRow));
    repoList.hidden = !repoList.childElementCount;
    repoStatus.textContent = repoList.hidden ? "No public repositories yet." : "Public repositories";
    reposLoaded = true;
  } catch {
    repoStatus.textContent = "The repository list is unavailable. Open GitHub below to browse directly.";
  } finally {
    reposLoading = false;
  }
}

function screenTransform() {
  const screen = screenEntrance.getBoundingClientRect();
  const panel = projectWindow.getBoundingClientRect();
  const x = screen.left + screen.width / 2 - panel.left - panel.width / 2;
  const y = screen.top + screen.height / 2 - panel.top - panel.height / 2;
  const scaleX = Math.min(.92, screen.width / panel.width);
  const scaleY = Math.min(.92, screen.height / panel.height);
  return `translate(${x}px, ${y}px) scale(${scaleX}, ${scaleY})`;
}

async function openProjects() {
  if (projectWindow.open) return;
  projectWindow.showModal();
  modalReturn.showPopover?.();
  loadRepos();
  if (reducedMotion.matches) return;

  const zoom = projectWindow.animate([
    { transform: screenTransform(), opacity: .22 },
    { transform: "none", opacity: 1 },
  ], { duration: 460, easing: "cubic-bezier(.18, .8, .22, 1)", fill: "both" });
  projectZoom = zoom;
  await zoom.finished.catch(() => {});
  if (projectZoom === zoom) {
    zoom.cancel();
    projectZoom = undefined;
  }
}

async function closeProjects(event) {
  event.preventDefault();
  if (!projectWindow.open || closingProjects) return;
  if (reducedMotion.matches) {
    projectZoom?.cancel();
    projectWindow.close();
    return;
  }

  closingProjects = true;
  const style = getComputedStyle(projectWindow);
  const start = { transform: style.transform, opacity: style.opacity };
  projectZoom?.cancel();
  const zoom = projectWindow.animate([
    start,
    { transform: screenTransform(), opacity: .14 },
  ], { duration: 350, easing: "cubic-bezier(.4, .04, .63, .9)", fill: "both" });
  projectZoom = zoom;
  await zoom.finished.catch(() => {});
  if (projectZoom === zoom) projectWindow.close();
}

screenEntrance.addEventListener("click", openProjects);
projectWindow.querySelector("form").addEventListener("submit", closeProjects);
projectWindow.addEventListener("cancel", closeProjects);
projectWindow.addEventListener("close", () => {
  if (modalReturn.matches(":popover-open")) modalReturn.hidePopover();
  projectZoom?.cancel();
  projectZoom = undefined;
  closingProjects = false;
  if (!indoorScene.hidden) screenEntrance.focus({ preventScroll: true });
});

updateScene(location.hash === "#studio");
