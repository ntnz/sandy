class PixelReveal {
  constructor(elementId) {
    this.element = document.getElementById(elementId);
    this.pixelSize = 40;

    // Generate a unique ID for this mask in case you use multiple on one page
    this.maskId = "pixel-mask-" + Math.random().toString(36).substr(2, 9);

    this._setupSVG();
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  // Creates an invisible SVG in the DOM to act as our hardware-accelerated mask
  _setupSVG() {
    this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    // Hide the SVG visually, but keep it in the DOM
    this.svg.style.position = "absolute";
    this.svg.style.width = "0";
    this.svg.style.height = "0";
    this.svg.style.pointerEvents = "none";

    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const mask = document.createElementNS("http://www.w3.org/2000/svg", "mask");
    mask.setAttribute("id", this.maskId);

    // We will draw all our pixels using a single, highly optimized SVG Path
    this.path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    this.path.setAttribute("fill", "white"); // In SVG masks, white = visible, black = hidden

    mask.appendChild(this.path);
    defs.appendChild(mask);
    this.svg.appendChild(defs);
    document.body.appendChild(this.svg);
  }

  resize() {
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.cols = Math.ceil(this.w / this.pixelSize);
    this.rows = Math.ceil(this.h / this.pixelSize);
    this.noiseMap = Array.from({ length: this.cols * this.rows }, () =>
      Math.random(),
    );
  }

  animate(direction, callback) {
    let progress = 0;
    const speed = 0.05;

    // Point the element's CSS to our live SVG mask
    this.element.style.webkitMaskImage = `url(#${this.maskId})`;
    this.element.style.maskImage = `url(#${this.maskId})`;

    const loop = () => {
      progress += speed;
      if (progress > 1) progress = 1;

      let d = ""; // The mathematical string that defines the squares
      let i = 0;

      for (let y = 0; y < this.rows; y++) {
        for (let x = 0; x < this.cols; x++) {
          let shouldDraw =
            direction === "in"
              ? this.noiseMap[i] < progress
              : this.noiseMap[i] > progress;

          if (shouldDraw) {
            const px = x * this.pixelSize;
            const py = y * this.pixelSize;
            const size = this.pixelSize + 1; // +1 prevents microscopic seams

            // SVG Path command: Move to (px, py), draw horizontal line, draw vertical line, draw horizontal back, close path
            d += `M${px},${py} h${size} v${size} h-${size} Z `;
          }
          i++;
        }
      }

      // Update the single path element (Incredibly fast, no CSS parsing required)
      this.path.setAttribute("d", d);

      if (progress < 1) {
        requestAnimationFrame(loop);
      } else {
        if (direction === "in") {
          // Detach mask when fully loaded so the browser doesn't waste memory masking a solid block
          this.element.style.webkitMaskImage = "none";
          this.element.style.maskImage = "none";
        }
        if (callback) callback();
      }
    };

    loop();
  }
}
