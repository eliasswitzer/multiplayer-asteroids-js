class Ship {

    constructor () {
        this.pos = createVector(random(width/2 - 100, width/2 + 100), random(height/2 - 50, height/2 + 50));
	    this.r = 12;
	    this.heading = random(0, 2*PI);
	    this.rotation = 0;

        this.velocity = createVector(0, 0);
        this.isBoosting = false;

        this.isDamaged = false;
        this.onCooldown = false;
        
        this.colour = color(255, 255, 255);
        this.alpha = 255;
        this.colorChoice = undefined;

        this.id = undefined;
    }

    update() {
        this.pos.add(this.velocity);
        this.velocity.mult(0.95);
        if (this.isBoosting) {
            this.boost();
        }
    }

    boosting(b) {
        this.isBoosting = b;
    }

    boost() {
        var force = p5.Vector.fromAngle(this.heading);
        force.mult(0.25);
        this.velocity.add(force);
    }

	render() {
		push();
		translate(this.pos.x, this.pos.y);
		rotate(this.heading + PI/2);
		fill(0);
        if (this.isDamaged) this.alpha = 150;
		else this.alpha = 255;
        if (this.colorChoice == 1) this.colour = color(255, 255, 102, this.alpha);
        else if (this.colorChoice == 2) this.colour = color(252, 110, 34, this.alpha);
        else if (this.colorChoice == 3) this.colour = color(255, 20, 147, this.alpha);
        else if (this.colorChoice == 4) this.colour = color(195, 76, 246, this.alpha);
        else if (this.colorChoice == 5) this.colour = color(184, 251, 60, this.alpha);
        else if (this.colorChoice == 6) this.colour = color(92, 229, 222, this.alpha);
        else if (this.colorChoice == 7) this.colour = color(88, 153, 251, this.alpha);
        else if (this.colorChoice == 8) this.colour = color(253, 203, 252, this.alpha);
        stroke(this.colour);
		strokeWeight(2);
		triangle(-this.r, this.r, this.r, this.r, 0, -this.r);
		pop();

        push();
        noFill();
        stroke(255);
        strokeWeight(2);
        if(invincibilityTimer == 4) arc(this.pos.x, this.pos.y, this.r * 4, this.r * 4, 0, 2*PI);
        else if(invincibilityTimer == 3) arc(this.pos.x, this.pos.y, this.r * 4, this.r * 4, 0, PI + PI/2);
        else if(invincibilityTimer == 2) arc(this.pos.x, this.pos.y, this.r * 4, this.r * 4, 0, PI);
        else if(invincibilityTimer == 1) arc(this.pos.x, this.pos.y, this.r * 4, this.r * 4, 0, PI/2);
        pop();
	}

	setRotation(angle){
		this.rotation += angle;
	}

	turn() {
		this.heading += this.rotation;
	}

    hits(asteroid) {
        var d = dist(this.pos.x, this.pos.y, asteroid.pos.x, asteroid.pos.y);
        if(d < this.r + asteroid.r) {
            return true;
        }
        else {
            return false;
        }
    }

    saved(teammateShip) {
        var d = dist(this.pos.x, this.pos.y, teammateShip.pos.x, teammateShip.pos.y);
        if (d < this.r + teammateShip.r) {
            return true;
        }
        else {
            return false;
        }
    }

    checkEdges() {
        if (this.pos.x > width + this.r) {
            this.pos.x = -this.r;
        }
        else if (this.pos.x < -this.r) {
            this.pos.x = width + this.r;
        }

        if (this.pos.y > height + this.r) {
            this.pos.y = -this.r;
        }
        else if (this.pos.y < -this.r) {
            this.pos.y = height + this.r;
        }
    }
}