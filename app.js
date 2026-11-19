const garden = document.querySelector(".garden");
const water = document.querySelector(".water");
const particles = document.querySelector(".particles");
const status = document.querySelector("#garden-status");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const lakeFish = [...water.querySelectorAll(".fish")];
const fishDashes = new Map();

function addEffect(parent, className, x, y, lifetime) {
  const effect = document.createElement("span");
  effect.className = className;
  effect.setAttribute("aria-hidden", "true");
  effect.style.left = `${x}px`;
  effect.style.top = `${y}px`;
  parent.append(effect);
  setTimeout(() => effect.remove(), lifetime);
  return effect;
}

function getScenePoint(event, surface, keyboardX, keyboardY) {
  const scene = garden.getBoundingClientRect();
  const bounds = surface.getBoundingClientRect();
  return {
    x: (event.detail ? event.clientX : scene.left + scene.width * keyboardX) - bounds.left,
    y: (event.detail ? event.clientY : scene.top + scene.height * keyboardY) - bounds.top,
  };
}

function scatter(target, kind, count, radius, layer = particles) {
  const bounds = target.getBoundingClientRect();
  const scene = layer.getBoundingClientRect();
  const x = bounds.left + bounds.width / 2 - scene.left;
  const y = bounds.top + bounds.height / 2 - scene.top;

  for (let index = 0; index < count; index += 1) {
    const angle = index / count * Math.PI * 2;
    const distance = radius * (.68 + Math.random() * .42);
    const fragment = addEffect(layer, kind, x, y, 740);
    fragment.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
    fragment.style.setProperty("--dy", `${Math.sin(angle) * distance}px`);
    if (kind === "spark") {
      fragment.textContent = index % 2 ? "✦" : "✧";
      fragment.style.setProperty("--spark-size", `${11 + Math.random() * 13}px`);
    }
  }
}

function lakeContains(outline, x, y) {
  let inside = false;
  for (let index = 0; index < outline.length; index += 1) {
    const [ax, ay] = outline[index];
    const [bx, by] = outline[(index + 1) % outline.length];
    if ((ay > y) !== (by > y) && x < ax + (bx - ax) * (y - ay) / (by - ay)) inside = !inside;
  }
  return inside;
}

function fishEscape(outline, center, angle, distance, margins) {
  const probes = [[0, 0], [-margins[0], 0], [margins[0], 0], [0, -margins[1]], [0, margins[1]]]
    .filter(([x, y]) => lakeContains(outline, center.x + x, center.y + y));
  let best = { x: 0, y: 0, progress: 0 };
  for (const turn of [0, -.55, .55, -1.1, 1.1]) {
    const dx = Math.cos(angle + turn);
    const dy = Math.sin(angle + turn);
    let travel = 0;
    for (let step = 1; step <= 12; step += 1) {
      const reach = distance * step / 12;
      if (!probes.every(([x, y]) => lakeContains(outline, center.x + x + dx * reach, center.y + y + dy * reach))) break;
      travel = reach;
    }
    const progress = travel * Math.cos(turn);
    if (progress > best.progress) best = { x: dx * travel, y: dy * travel, progress };
    if (travel === distance && turn === 0) break;
  }
  return best;
}

function scatterLakeFish(click, duration) {
  const range = Math.min(garden.clientWidth * .11, 155);
  const lakeBounds = water.getBoundingClientRect();
  const outline = Array.from(getComputedStyle(water).clipPath.matchAll(/([\d.]+)% ([\d.]+)%/g),
    ([, x, y]) => [Number(x) * lakeBounds.width / 100, Number(y) * lakeBounds.height / 100]);
  const glide = 640;
  const settle = duration / (duration + glide);
  lakeFish.forEach((fish, index) => {
    const swim = fish.getAnimations().find(animation => animation.animationName === "swim");
    if (!swim) return;

    const bounds = fish.getBoundingClientRect();
    const pose = getComputedStyle(fish).transform;
    const { a, e: x, f: y } = new DOMMatrixReadOnly(pose);
    const center = {
      x: bounds.left + bounds.width / 2 - lakeBounds.left,
      y: bounds.top + bounds.height / 2 - lakeBounds.top,
    };
    const dx = center.x - click.x;
    const dy = center.y - click.y;
    const angle = Math.hypot(dx, dy) > 3 ? Math.atan2(dy, dx) : -Math.PI / 4 + index * Math.PI / 2;
    const reach = Math.min(230, Math.max(85, garden.clientWidth * .15)) * (1 - index * .09);
    const escape = fishEscape(outline, center, angle, reach, [fish.offsetWidth * .22, fish.offsetHeight * .22]);
    const direction = Math.abs(escape.x) > 4 ? Math.sign(escape.x) : a >= 0 ? -1 : 1;
    const facing = -direction;
    const tilt = direction * Math.atan2(escape.y, Math.abs(escape.x)) * 180 / Math.PI;
    const heading = Math.max(-40, Math.min(40, tilt));
    const end = Math.max(-range, Math.min(range, x + escape.x));
    const patrolLift = direction * 7 * (1 - Math.abs(end) / range);
    const progress = (end * direction + range) / (2 * range);
    const patrolPhase = direction < 0 ? (progress <= .5 ? .48 * progress : .02 + .44 * progress) : .5 + .46 * progress;
    const tail = fish.firstElementChild.getAnimations()[0];
    const transform = (left, top, rotation = 0) =>
      `translate(${left}px, ${top}px) rotate(${rotation}deg) scaleX(${facing})`;

    fishDashes.get(fish)?.cancel();
    swim.pause();
    tail?.updatePlaybackRate(3.6 - index * .3);
    const burst = settle * (.21 + index * .037);
    const dash = fish.animate([
      { transform: pose, easing: "ease-out" },
      { transform: transform(x + escape.x * .1, y + escape.y * .1, heading), offset: .04, easing: "cubic-bezier(.12,.66,.29,1)" },
      { transform: transform(x + escape.x * .86, y + escape.y * .86, heading * .8), offset: burst, easing: "ease-out" },
      { transform: transform(x + escape.x, y + escape.y, heading * .42), offset: settle, easing: "ease-in-out" },
      { transform: transform(end, patrolLift) },
    ], { duration: duration + glide, fill: "forwards" });
    fishDashes.set(fish, dash);
    setTimeout(() => {
      if (fishDashes.get(fish) === dash) tail?.updatePlaybackRate(1);
    }, duration);

    dash.finished.then(() => {
      if (fishDashes.get(fish) !== dash) return;
      fishDashes.delete(fish);
      const { delay, duration: period } = swim.effect.getTiming();
      const phase = delay + period * patrolPhase;
      swim.currentTime = (phase + period) % period;
      swim.play();
      tail?.updatePlaybackRate(1);
      dash.cancel();
    }, () => {});
  });
}

water.addEventListener("click", event => {
  const { x, y } = getScenePoint(event, water, .64, .82);
  const diameter = Math.min(400, Math.max(155, garden.clientWidth * .32));
  const rippleLifetime = reducedMotion.matches ? 680 : 1550;
  status.textContent = reducedMotion.matches
    ? "Ripples spread across the lake."
    : "The startled fish dart away as ripples spread.";

  for (let index = 0; index < 3; index += 1) {
    const ripple = addEffect(water, "ripple", x, y, rippleLifetime);
    ripple.style.setProperty("--delay", `${index * 108}ms`);
    ripple.style.setProperty("--diameter", `${diameter * (1 - index * .19)}px`);
  }
  if (!reducedMotion.matches) scatterLakeFish({ x, y }, rippleLifetime);
});

for (const bubble of document.querySelectorAll(".bubble")) {
  bubble.addEventListener("click", async () => {
    if (bubble.dataset.active) return;
    status.textContent = "The bubble popped.";
    scatter(bubble, "droplet", 12, bubble.offsetWidth * .73 + 23);
    if (reducedMotion.matches) return;

    bubble.dataset.active = "true";
    const animation = bubble.animate([
      { scale: 1, opacity: 1 },
      { scale: 1.22, opacity: 0, offset: .28 },
      { scale: .45, opacity: 0, offset: .52 },
      { scale: 1, opacity: 1 },
    ], { duration: 830, easing: "ease-out" });
    await animation.finished;
    delete bubble.dataset.active;
  });
}

const halo = document.querySelector(".halo");
const haloRing = halo.querySelector(".halo-ring");
let pulse;
halo.addEventListener("click", () => {
  status.textContent = "The halo lit up.";
  scatter(halo, "spark", 13, halo.offsetWidth * .62);
  if (reducedMotion.matches) return;

  pulse?.cancel();
  pulse = haloRing.animate([
    { filter: "brightness(1)", transform: "scale(1)" },
    { filter: "brightness(2)", transform: "scale(1.22)", offset: .29 },
    { filter: "brightness(1)", transform: "scale(1)" },
  ], { duration: 720, easing: "ease-out" });
});

for (const butterfly of document.querySelectorAll(".butterfly")) {
  butterfly.addEventListener("click", async () => {
    if (butterfly.dataset.active) return;
    status.textContent = "The butterfly fluttered away.";
    scatter(butterfly, "spark", 7, butterfly.offsetWidth * .87);
    if (reducedMotion.matches) return;

    const scene = garden.getBoundingClientRect();
    const wings = butterfly.getBoundingClientRect();
    const x = wings.left + wings.width / 2 - scene.left;
    const y = wings.top + wings.height / 2 - scene.top;
    const distance = Math.min(scene.width * .13, 90) * (x > scene.width * .5 ? -1 : 1);
    const lift = Math.min(scene.height * .065, 48) * (y < scene.height * .24 ? 1 : -1);
    butterfly.dataset.active = "true";
    const flight = butterfly.animate([
      { transform: "translate(0, 0)" },
      { transform: `translate(${distance * .39}px, ${lift}px) rotate(14deg)`, offset: .3 },
      { transform: `translate(${distance}px, ${lift * .52}px) rotate(-12deg)`, offset: .62 },
      { transform: "translate(0, 0)" },
    ], { duration: 1450, easing: "ease-in-out" });
    await flight.finished;
    delete butterfly.dataset.active;
  });
}
