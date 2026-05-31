class FloatingEnvironment {
  constructor() {
    const {
      Engine,
      Runner,
      Bodies,
      Composite,
      Mouse,
      MouseConstraint,
      Events,
    } = Matter;

    this.Matter = Matter;
    this.engine = Engine.create();

    this.engine.gravity.y = 0;
    this.engine.gravity.x = 0;
    this.engine.timing.timeScale = 0.5;

    this.domBodies = [];
    this.thickness = 2000;

    // Buffer to ensure elements don't span 100% of the screen edge-to-edge
    this.screenBuffer = 40;

    this._setupBoundaries();
    this._setupMouse();
    this._setupDriftLogic();

    const runner = Runner.create();
    Runner.run(runner, this.engine);

    this._syncDOM();

    window.addEventListener("resize", () => this._handleResize());
  }

  add(domElement, x, y) {
    domElement.style.position = "absolute";
    domElement.style.top = "0px";
    domElement.style.left = "0px";
    domElement.style.margin = "0px";
    domElement.style.transformOrigin = "center center";
    domElement.style.userSelect = "none";
    domElement.style.WebkitUserDrag = "none";
    domElement.style.touchAction = "none";
    domElement.style.cursor = "grab";

    // Enforce an absolute size ceiling based on the current window so elements
    // are never larger than the physics bounding box.
    domElement.style.maxWidth = `${window.innerWidth - this.screenBuffer}px`;
    domElement.style.maxHeight = `${window.innerHeight - this.screenBuffer}px`;

    const width = domElement.offsetWidth;
    const height = domElement.offsetHeight;

    if (width === 0 || height === 0) return;

    const centerX = x + width / 2;
    const centerY = y + height / 2;

    const body = this.Matter.Bodies.rectangle(centerX, centerY, width, height, {
      restitution: 0.1,
      frictionAir: 0.1,
      density: 0.005,
    });

    body.driftDNA = {
      seed: Math.random() * Math.PI * 2,
      speed: 0.001 + Math.random() * 0.001,
    };

    this.Matter.Composite.add(this.engine.world, [body]);

    this.domBodies.push({
      domElement: domElement,
      physicsBody: body,
      width: width,
      height: height,
    });
  }

  _setupBoundaries() {
    const { Bodies, Composite } = this.Matter;
    const wallLength = 10000;

    this.ground = Bodies.rectangle(0, 0, wallLength, this.thickness, {
      isStatic: true,
    });
    this.ceiling = Bodies.rectangle(0, 0, wallLength, this.thickness, {
      isStatic: true,
    });
    this.leftWall = Bodies.rectangle(0, 0, this.thickness, wallLength, {
      isStatic: true,
    });
    this.rightWall = Bodies.rectangle(0, 0, this.thickness, wallLength, {
      isStatic: true,
    });

    Composite.add(this.engine.world, [
      this.ground,
      this.ceiling,
      this.leftWall,
      this.rightWall,
    ]);

    this._handleResize();
  }

  _handleResize() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // 1. Strictly bind the physical walls to the visual viewport edges.
    this.Matter.Body.setPosition(this.ground, {
      x: windowWidth / 2,
      y: windowHeight + this.thickness / 2,
    });
    this.Matter.Body.setPosition(this.ceiling, {
      x: windowWidth / 2,
      y: -(this.thickness / 2),
    });
    this.Matter.Body.setPosition(this.leftWall, {
      x: -(this.thickness / 2),
      y: windowHeight / 2,
    });
    this.Matter.Body.setPosition(this.rightWall, {
      x: windowWidth + this.thickness / 2,
      y: windowHeight / 2,
    });

    // 2. Dynamically scale the physics bodies to match the newly calculated CSS sizes
    this.domBodies.forEach((item) => {
      const body = item.physicsBody;

      // Update the ceiling limit before taking the new measurement
      item.domElement.style.maxWidth = `${windowWidth - this.screenBuffer}px`;
      item.domElement.style.maxHeight = `${windowHeight - this.screenBuffer}px`;

      const newWidth = item.domElement.offsetWidth;
      const newHeight = item.domElement.offsetHeight;

      const scaleX = newWidth / item.width;
      const scaleY = newHeight / item.height;

      if (scaleX !== 1 || scaleY !== 1) {
        this.Matter.Body.scale(body, scaleX, scaleY);
        item.width = newWidth;
        item.height = newHeight;
      }

      // 3. Prevent items from falling out of bounds
      const halfWidth = item.width / 2;
      const halfHeight = item.height / 2;

      let newX = body.position.x;
      let newY = body.position.y;
      let requiresRepositioning = false;

      // X-axis clamp
      if (newX - halfWidth < 0) {
        newX = halfWidth;
        requiresRepositioning = true;
      } else if (newX + halfWidth > windowWidth) {
        newX = windowWidth - halfWidth;
        requiresRepositioning = true;
      }

      // Y-axis clamp
      if (newY - halfHeight < 0) {
        newY = halfHeight;
        requiresRepositioning = true;
      } else if (newY + halfHeight > windowHeight) {
        newY = windowHeight - halfHeight;
        requiresRepositioning = true;
      }

      if (requiresRepositioning) {
        this.Matter.Body.setPosition(body, { x: newX, y: newY });
      }
    });
  }

  _setupMouse() {
    const { Mouse, MouseConstraint, Composite, Events } = this.Matter;

    const mouse = Mouse.create(document.body);
    this.mouseConstraint = MouseConstraint.create(this.engine, {
      mouse: mouse,
      constraint: { stiffness: 0.9, render: { visible: false } },
    });

    Composite.add(this.engine.world, this.mouseConstraint);

    Events.on(this.mouseConstraint, "startdrag", (event) => {
      const item = this.domBodies.find((i) => i.physicsBody === event.body);
      if (item) item.domElement.style.cursor = "grabbing";
    });

    Events.on(this.mouseConstraint, "enddrag", (event) => {
      const item = this.domBodies.find((i) => i.physicsBody === event.body);
      if (item) item.domElement.style.cursor = "grab";
    });
  }

  _setupDriftLogic() {
    this.Matter.Events.on(this.engine, "beforeUpdate", () => {
      const time = this.engine.timing.timestamp;
      const maxVelocity = 10;

      this.domBodies.forEach((item) => {
        const body = item.physicsBody;

        if (
          Math.abs(body.velocity.x) > maxVelocity ||
          Math.abs(body.velocity.y) > maxVelocity
        ) {
          this.Matter.Body.setVelocity(body, {
            x:
              Math.sign(body.velocity.x) *
              Math.min(Math.abs(body.velocity.x), maxVelocity),
            y:
              Math.sign(body.velocity.y) *
              Math.min(Math.abs(body.velocity.y), maxVelocity),
          });
        }

        if (Math.abs(body.angularVelocity) > 0.1) {
          this.Matter.Body.setAngularVelocity(
            body,
            Math.sign(body.angularVelocity) * 0.1,
          );
        }

        if (this.mouseConstraint.body === body) return;

        const forceMagnitude = 0.0001 * body.mass;
        const wave = Math.sin(time * body.driftDNA.speed + body.driftDNA.seed);

        this.Matter.Body.applyForce(body, body.position, {
          x: wave * forceMagnitude,
          y:
            Math.cos(time * body.driftDNA.speed + body.driftDNA.seed) *
            forceMagnitude,
        });
      });
    });
  }

  _syncDOM() {
    window.requestAnimationFrame(() => this._syncDOM());

    this.domBodies.forEach((item) => {
      const x = item.physicsBody.position.x - item.width / 2;
      const y = item.physicsBody.position.y - item.height / 2;
      const angle = item.physicsBody.angle;

      item.domElement.style.transform = `translate(${x}px, ${y}px) rotate(${angle}rad)`;
    });
  }
}
