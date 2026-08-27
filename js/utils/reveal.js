const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const observed = new WeakSet();

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    observer.unobserve(entry.target);
  });
}, {
  threshold: 0.08,
  rootMargin: '0px 0px -24px 0px'
});

export function observeReveal(element) {
  if (!element || observed.has(element) || element.classList.contains('visible')) return;
  observed.add(element);
  if (reduceMotion) {
    element.classList.add('visible');
    return;
  }
  observer.observe(element);
}

export function observeAll(root = document) {
  root.querySelectorAll('.reveal:not(.visible)').forEach(observeReveal);
}

function observeAddedNode(node) {
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  if (node.classList.contains('reveal')) observeReveal(node);
  observeAll(node);
}

new MutationObserver(records => {
  records.forEach(record => record.addedNodes.forEach(observeAddedNode));
}).observe(document.body, { childList: true, subtree: true });
