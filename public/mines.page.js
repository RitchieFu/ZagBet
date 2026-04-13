const GRID_SIZE = 5;
const MIN_MINES = 1;
const MAX_MINES = 20;
const DEFAULT_MINES = 3;

function initMinesLayout() {
  const select = document.getElementById("mine-count");
  const grid = document.querySelector(".mines-grid");

  for (let n = MIN_MINES; n <= MAX_MINES; n++) {
    const opt = document.createElement("option");
    opt.value = String(n);
    opt.textContent = String(n);
    if (n === DEFAULT_MINES) opt.selected = true;
    select.appendChild(opt);
  }

  const totalCells = GRID_SIZE * GRID_SIZE;
  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement("div");
    cell.className = "mines-cell";
    cell.setAttribute("role", "gridcell");
    grid.appendChild(cell);
  }
}

initMinesLayout();
