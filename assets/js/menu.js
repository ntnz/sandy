window.addEventListener("load", () => {
  const toggleBtn = document.getElementById("menu-toggle-button");
  const toggleImg = document.getElementById("menu-toggle-image");
  const menuOverlay = document.getElementById("menu-overlay");
  const closeImgPath = toggleBtn.dataset.closeImg;
  const openImgPath = toggleBtn.dataset.openImg;

  if (!toggleBtn || !menuOverlay) return;

  // Initialize the reveal effect on your menu container
  const pixelReveal = new PixelReveal("menu-overlay");

  let isAnimating = false;
  let menuIsOpen = false;

  const toggleMenu = () => {
    if (isAnimating) return;
    isAnimating = true;

    if (!menuIsOpen) {
      // 1. Prepare to open
      toggleImg.src = closeImgPath;
      menuOverlay.classList.add("is-visible"); // Ensure CSS displays it

      // 2. Pixelate IN
      pixelReveal.animate("in", () => {
        isAnimating = false;
        menuIsOpen = true;
      });
    } else {
      // 1. Prepare to close
      toggleImg.src = openImgPath;

      // 2. Pixelate OUT
      pixelReveal.animate("out", () => {
        menuOverlay.classList.remove("is-visible"); // Hide from DOM
        isAnimating = false;
        menuIsOpen = false;
      });
    }
  };

  toggleBtn.addEventListener("click", toggleMenu);
});
