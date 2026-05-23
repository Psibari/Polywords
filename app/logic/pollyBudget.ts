let totalShown = 0;
let runStart   = Date.now();

export function getPollyBudgetState() {
  return { totalShown, runStart };
}

export function trackPollyTime(dur: number) {
  totalShown += dur;
}

export function resetPollyBudget() {
  totalShown = 0;
  runStart   = Date.now();
}
