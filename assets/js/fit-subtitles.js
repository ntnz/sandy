window.addEventListener("load", () => {
  const blocks = document.querySelectorAll(".title-subtitles");

  // shrink subtitles if the longest one doesn't fit
  const fit = (block) => {
    block.style.removeProperty("--subtitle-scale");

    let widest = 0;
    block.querySelectorAll(".title-subtitle").forEach((line) => {
      widest = Math.max(widest, line.scrollWidth);
    });

    if (widest > block.clientWidth) {
      block.style.setProperty("--subtitle-scale", (block.clientWidth / widest) * 0.99);
    }
  };

  const observer = new ResizeObserver((entries) => {
    entries.forEach((entry) => fit(entry.target));
  });

  blocks.forEach((block) => observer.observe(block));
});
