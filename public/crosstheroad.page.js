const duck = document.getElementById("duck");
const jumpBtn = document.getElementById("jump");
let forwardPx = 0;

jumpBtn?.addEventListener("click", () => {
  forwardPx += 200;
  if (duck) duck.style.transform = `translateX(${forwardPx}px)`;
});
