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

    this._setupBoundaries();
    this._setupMouse();
    this._setupDriftLogic();

    const runner = Runner.create();
    Runner.run(runner, this.engine);

    this._syncDOM();
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

    const rect = domElement.getBoundingClientRect();
    const width = rect.width || 100;
    const height = rect.height || 100;

    const centerX = x + width / 2;
    const centerY = y + height / 2;

    const body = this.Matter.Bodies.rectangle(centerX, centerY, width, height, {
      restitution: 0.1, // Low bounce so they don't ricochet wildly
      frictionAir: 0.1, // The "thick liquid" drag
      density: 0.005,
    });

    body.driftDNA = {
      seed: Math.random() * Math.PI * 2,
      speed: 0.001 + Math.random() * 0.001,
    };

    // Added body to the world without a constraint
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
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Increase thickness from 50 to 2000
    const thickness = 2000;

    // Adjust the coordinates so the inner edge perfectly aligns with the screen edge
    const ground = Bodies.rectangle(
      width / 2,
      height + thickness / 2,
      width * 3,
      thickness,
      { isStatic: true },
    );
    const ceiling = Bodies.rectangle(
      width / 2,
      -(thickness / 2),
      width * 3,
      thickness,
      { isStatic: true },
    );
    const leftWall = Bodies.rectangle(
      -(thickness / 2),
      height / 2,
      thickness,
      height * 3,
      { isStatic: true },
    );
    const rightWall = Bodies.rectangle(
      width + thickness / 2,
      height / 2,
      thickness,
      height * 3,
      { isStatic: true },
    );

    Composite.add(this.engine.world, [ground, ceiling, leftWall, rightWall]);
  }

  _setupMouse() {
    const { Mouse, MouseConstraint, Composite, Events } = this.Matter;

    const mouse = Mouse.create(document.body);
    this.mouseConstraint = MouseConstraint.create(this.engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.9, // Direct, tight grip with no rubber-band lag
        render: { visible: false },
      },
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

      this.domBodies.forEach((item) => {
        const body = item.physicsBody;

        // Do not apply idle drift if the user is actively dragging it
        if (this.mouseConstraint.body === body) return;

        // Apply a barely perceptible force just to keep them from freezing completely
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
