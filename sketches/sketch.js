const { Responsive } = P5Template;

let angleOffset = 0;
let bubbles = [],
  jellyfish = [],
  fishes = [];

function setup() {
  new Responsive().createResponsiveCanvas(800, 600, 'contain', true);
  colorMode(HSB, 360, 100, 100, 255);
  noFill();
  strokeWeight(2);

  const colors = [
    { h: 200, s: 40, b: 90 },
    { h: 270, s: 40, b: 90 },
    { h: 320, s: 35, b: 95 },
    { h: 220, s: 30, b: 90 },
  ];

  for (let i = 0; i < 50; i++) bubbles.push(new Bubble());

  const jellyfishData = [
    {
      pos: createVector(width / 2 - 60, height / 2 + 40),
      r: 160,
      c: colors[0],
    },
    { pos: createVector(140, 130), r: 110, c: colors[1] },
    { pos: createVector(670, 500), r: 95, c: colors[2] },
    { pos: createVector(520, 160), r: 75, c: colors[3] },
  ];

  for (let d of jellyfishData) {
    jellyfish.push(new Jellyfish(d.pos, d.r, d.c));
  }

  for (let i = 0; i < 6; i++)
    fishes.push(
      new Fish(random(width), random(height * 0.3, height * 0.9), {
        h: random(190, 250),
        s: 30,
        b: 95,
      })
    );
}

function draw() {
  backgroundGradient();

  bubbles.forEach((b) => {
    b.update();
    b.display();
  });
  fishes.forEach((f) => {
    f.update();
    f.display();
  });

  const mouseVec = createVector(mouseX - width / 2, mouseY - height / 2);
  const shrink = map(mouseVec.mag(), 0, 300, 0.3, 1, true);

  jellyfish.forEach((j) => {
    j.update(jellyfish);
    j.display(mouseVec, shrink);
  });

  angleOffset += 0.05;
}

function backgroundGradient() {
  noFill();
  for (let y = 0; y <= height; y++) {
    let t = y / height;
    stroke(lerp(200, 210, t), lerp(20, 25, t), lerp(95, 100, t), 40);
    line(0, y, width, y);
  }

  noStroke();
  let glowX = width * 0.25,
    glowY = height * 0.18;
  for (let r = 140; r > 0; r -= 4) {
    fill(200, 30, 100, map(r, 140, 0, 15, 0));
    ellipse(glowX, glowY, r * 2);
  }
}

class Bubble {
  constructor() {
    this.reset();
  }
  reset() {
    this.x = random(width);
    this.y = random(height);
    this.size = random(5, 18);
    this.speed = random(0.15, 0.6);
    this.alpha = random(40, 120);
  }
  update() {
    this.y -= this.speed;
    if (this.y < -this.size) {
      this.reset();
      this.y = height + this.size;
    }
  }
  display() {
    noStroke();
    const steps = 8;
    for (let s = steps; s > 0; s--) {
      fill(210, 25, 95, ((this.alpha * s) / steps) * 0.5);
      ellipse(this.x, this.y, (this.size / steps) * s);
    }
  }
}

class Jellyfish {
  constructor(pos, r, c) {
    this.pos = pos.copy();
    this.vel = p5.Vector.random2D().mult(random(0.2, 0.6));
    this.r = r;
    this.c = c;
    this.angleOffsetLocal = random(TWO_PI);
    this.wigglePhase = random(TWO_PI);
  }
  update(others) {
    let force = createVector();
    others.forEach((o) => {
      if (o !== this) {
        let diff = p5.Vector.sub(this.pos, o.pos);
        let dist = diff.mag();
        let minD = this.r * 0.85 + o.r * 0.85;
        if (dist < minD && dist > 0)
          force.add(diff.normalize().mult((minD - dist) * 0.1));
      }
    });
    this.vel.add(force);
    this.vel.x += sin(frameCount * 0.05 + this.wigglePhase) * 0.15;
    this.vel.y += cos(frameCount * 0.04 + this.wigglePhase) * 0.15;
    this.vel.limit(1);
    this.pos.add(this.vel);
    this.angleOffsetLocal += 0.03;
    this.pos.x = constrain(this.pos.x, this.r, width - this.r);
    this.pos.y = constrain(this.pos.y, this.r, height - this.r);
  }
  display(mouseVec, shrink) {
    push();
    translate(this.pos.x, this.pos.y);
    const steps = 120;
    const baseA = mouseVec.heading();

    for (let j = 0; j < 4; j++) {
      beginShape();
      for (let i = 0; i <= steps; i++) {
        let angle = map(i, 0, steps, 0, TWO_PI);
        let wave =
          sin(angle * 7 + angleOffset + j * 1.7 + this.angleOffsetLocal) * 5;
        let rad = this.r * shrink + wave;
        stroke((this.c.h + j * 8) % 360, this.c.s, this.c.b - j * 8, 165);
        vertex(cos(angle + baseA) * rad, sin(angle + baseA) * rad);
      }
      endShape(CLOSE);
    }

    for (let r = 15; r < this.r * shrink; r += 7) {
      beginShape();
      for (let i = 0; i <= steps; i++) {
        let angle = map(i, 0, steps, 0, TWO_PI);
        let wave =
          sin(angle * 7 + angleOffset + r * 0.3 + this.angleOffsetLocal) * 8;
        let rad = r + wave + mouseVec.mag() * 0.1;
        let hueRaw =
          map(r, 15, this.r, this.c.h - 30, this.c.h + 30) +
          mouseVec.mag() * 0.2;
        let hue = (hueRaw + 360) % 360;
        if (hue > 340 || hue < 20) hue = (hue + 40) % 360;
        stroke(hue, this.c.s + 5, this.c.b - 2, 204);
        vertex(cos(angle + baseA) * rad, sin(angle + baseA) * rad);
      }
      endShape(CLOSE);
    }

    strokeWeight(1.2);
    for (let t = 0; t < 15; t++) {
      let baseAngle =
        angleOffset * 2 + (t * TWO_PI) / 15 + this.angleOffsetLocal;
      let len = this.r * 1.15 * shrink;
      beginShape();
      for (let i = 0; i < 90; i++) {
        let p = i / 90;
        let sway = sin(p * 18 + frameCount * 0.12 + t) * 14 * (1 - p);
        let r = p * len;
        stroke(this.c.h, this.c.s, this.c.b, map(p, 0, 1, 180, 0) * 0.6);
        vertex(
          cos(baseAngle) * r + cos(baseAngle + HALF_PI) * sway,
          sin(baseAngle) * r + sin(baseAngle + HALF_PI) * sway
        );
      }
      endShape();
    }

    noStroke();
    let dist = mouseVec.mag();
    for (let b = 0; b < 12; b++) {
      let angle = map(b, 0, 12, 0, TWO_PI);
      let rad = this.r * shrink * 0.55 * random(0.6, 1);
      fill(0, 0, 100, 190);
      ellipse(
        cos(angle + this.angleOffsetLocal) * rad,
        sin(angle + this.angleOffsetLocal) * rad,
        map(dist, 0, 300, 1.8, 6, true)
      );
    }
    pop();
  }
}

class Fish {
  constructor(x, y, c) {
    this.x = x;
    this.y = y;
    this.c = c;
    this.speed = random(0.5, 1.2);
    this.size = random(15, 25);
  }
  update() {
    this.x += this.speed;
    if (this.x > width + this.size) {
      this.x = -this.size;
      this.y = random(height * 0.3, height * 0.9);
    }
  }
  display() {
    push();
    translate(this.x, this.y);
    noStroke();
    fill(this.c.h, this.c.s, this.c.b, 200);
    ellipse(0, 0, this.size * 1.5, this.size);
    triangle(
      -this.size * 0.75,
      0,
      -this.size * 1.2,
      -this.size * 0.4,
      -this.size * 1.2,
      this.size * 0.4
    );
    pop();
  }
}
