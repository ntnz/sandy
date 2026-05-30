class PixelTransition {
  constructor(element) {
    this.el = element;
    this.canvas = element.querySelector(".pixel-canvas");
    this.ctx = this.canvas.getContext("2d");

    this.imgMain = element.querySelector(".main-img");
    this.imgHover = element.querySelector(".hover-img");

    this.progress = 0;
    this.isHovering = false;
    this.animating = false;

    // Adjust this to make the transition more or less pixelated
    this.maxPixelSize = 30;

    // STRICT LOADER: Force the script to wait until both images
    // have physically downloaded and possess actual dimensions
    const loadImg = (img) => {
      return new Promise((resolve) => {
        if (img.complete && img.naturalWidth !== 0) {
          resolve();
        } else {
          img.onload = () => resolve();
        }
      });
    };

    // Only run init() when BOTH images are fully ready
    Promise.all([loadImg(this.imgMain), loadImg(this.imgHover)]).then(() => {
      this.init();
    });
  }

  init() {
    this.canvas.width = this.imgMain.naturalWidth;
    this.canvas.height = this.imgMain.naturalHeight;
    this.draw();

    const isTouchDevice =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;

    if (isTouchDevice) {
      // MOBILE UX: Tap -> Animate -> Route
      this.el.addEventListener("click", (e) => {
        // Stop the browser from instantly changing the page
        e.preventDefault();

        // Prevent spam-clicking if the animation is already running
        if (this.isHovering) return;

        this.isHovering = true;

        // Run the animation, and pass the routing command as a callback
        this.animate(() => {
          window.location.href = this.el.href;
        });
      });
    } else {
      // DESKTOP UX: Standard mouse hover
      this.el.addEventListener("mouseenter", () => {
        this.isHovering = true;
        this.animate();
      });

      this.el.addEventListener("mouseleave", () => {
        this.isHovering = false;
        this.animate();
      });
    }
  }

  animate(callback) {
    if (this.animating) return;
    this.animating = true;

    const loop = () => {
      const target = this.isHovering ? 1 : 0;

      // Adjust the 0.1 to make the transition faster or slower
      this.progress += (target - this.progress) * 0.1;

      // When the animation is mathematically finished
      if (Math.abs(target - this.progress) < 0.005) {
        this.progress = target;
        this.animating = false;
        this.draw(); // Force one last crisp draw

        // Fire the callback (which routes the page on mobile)
        if (callback) callback();
        return;
      }

      this.draw();
      requestAnimationFrame(loop);
    };

    loop();
  }

  draw() {
    const w = this.canvas.width;
    const h = this.canvas.height;

    this.ctx.imageSmoothingEnabled = false;

    const intensity = 1 - Math.abs((this.progress - 0.5) * 2);
    const currentPixelSize = 1 + this.maxPixelSize * intensity;
    const currentImg = this.progress > 0.5 ? this.imgHover : this.imgMain;

    if (currentPixelSize <= 1.2) {
      this.ctx.drawImage(currentImg, 0, 0, w, h);
    } else {
      const scaledW = w / currentPixelSize;
      const scaledH = h / currentPixelSize;

      this.ctx.drawImage(currentImg, 0, 0, scaledW, scaledH);
      this.ctx.drawImage(this.canvas, 0, 0, scaledW, scaledH, 0, 0, w, h);
    }
  }
}

// Hook it up when the page loads
window.addEventListener("load", () => {
  document.querySelectorAll(".pixel-hover-item").forEach((item) => {
    new PixelTransition(item);
  });
});
