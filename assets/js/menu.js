window.addEventListener("load", () => {
  const toggleBtn = document.getElementById("menu-toggle-button");
  const toggleImg = document.getElementById("menu-toggle-image");
  const menuOverlay = document.getElementById("menu-overlay");
  const closeImgPath = toggleBtn.dataset.closeImg;
  const openImgPath = toggleBtn.dataset.openImg;

  let menuIsOpen = false;

  const toggleMenu = (event) => {
    if (event) event.preventDefault();

    if (!menuIsOpen) {
      toggleImg.src = closeImgPath;
      menuOverlay.classList.add("is-visible");
      menuIsOpen = true;
    } else {
      toggleImg.src = openImgPath;
      menuOverlay.classList.remove("is-visible");
      menuIsOpen = false;
    }
  };

  // Bind exclusively to pointerup
  toggleBtn.addEventListener("pointerup", toggleMenu);
});
