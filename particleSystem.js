class Particle {
    constructor(settings, name, manager) {
        this.name = name;
        this.opacity = 0;
        this.isConnected = false;
        this.manager = manager;
        this.size = this.randomNumber(settings.min_size, settings.max_size);
        this.x = this.randomNumberOnAxis('x');
        this.y = this.randomNumberOnAxis('y');
        this.directionX = (Math.random() * 5) - 2.2;
        this.directionY = (Math.random() * 5) - 2.2; 
        this.global_alpha = settings.global_alpha;
    }
    randomNumberOnAxis(axis){
        let widthORheight = window.innerWidth;
        let particleSize = this.size * 2;
        if(axis === 'y'){
            widthORheight = window.innerHeight;
        }
        let num = this.randomNumber(0, widthORheight - (particleSize));
        return num;
    }
    randomNumber(min, max) {
        return Math.random() * (max - min) + min;
    }
    draw() {
        //this.manager.ctx.globalAlpha = this.global_alpha;
        this.manager.ctx.beginPath();
        this.manager.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        let color;

        if(this.global_alpha){
            color = 'rgba(255,255,255)' + this.global_alpha + ')';
        }else{
            if (this.isConnected) {
                this.opacity += 0.1;
                if(this.opacity >= 1){
                    this.opacity = 1;
                }
                color = 'rgba(' + settings.dot_color.join() + "," + this.opacity + ')';
            } else {
                this.opacity -= 0.1;
                if (this.opacity <= 0.3) {
                    this.opacity = 0.3;
                }
                color = 'rgba(' + settings.dot_color.join() + "," + this.opacity + ')';
            }
        }
        
        this.manager.ctx.fillStyle = color;
        this.manager.ctx.fill();
        if (this.isConnected) {
            this.manager.ctx.shadowOffsetX = 0;
            this.manager.ctx.shadowOffsetY = 0;
            this.manager.ctx.shadowColor = color;
            this.manager.ctx.shadowBlur = settings.dot_glow_amount;
        }
    }
    update() {
        if (this.x > canvas.width || this.x < 0) {
            this.directionX = -this.directionX;
        }
        if (this.y > canvas.height || this.y < 0) {
            this.directionY = -this.directionY;
        }
        this.x += this.directionX * settings.speed;
        this.y += this.directionY * settings.speed;
        this.draw();
    }
}

class AnimationLoop {
    constructor(options) {
        this.callback = options.callback;
        this.deltaTime = 0;
        this.lastTime = 0;
        this.timer = 0;
        this.manager = options.manager;
        this.interval = 1000 / options.fps;
    }
    animate(timestamp) {
        this.deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        if (this.timer > this.interval) {
            this.timer = 0;
            this.callback(this.manager);
        } else {
            this.timer += this.deltaTime;
        }
        requestAnimationFrame(this.animate.bind(this));
    }
}

class ParticleSystem {
    constructor(settings, canvas) {
        this.settings = settings;
        this.ctx = canvas.getContext('2d');
        this.connectionParticles = [];
        this.randomParticles = [];
        this.aParticles = [];
        this.bParticles = [];
        this.animateParticles = function() {
            for (let i = 0; i < this.connectionParticles.length; i++) {
                this.connectionParticles[i].update();
            }
            for (let i = 0; i < this.randomParticles.length; i++) {
                this.randomParticles[i].update();
            }
        }
        this.clearRect = function() {
            this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        }
        this.connectParticles = function() {
            this.calculateIfNeedsConnected();
        }
    }
    changeParticleOpacityOnConnect(aParticle, bParticle) {
        if (this.aParticles.includes(aParticle.name)) {
            aParticle.isConnected = true;
        } else {
            this.aParticles.push(aParticle.name);
        }
        if (this.bParticles.includes(bParticle.name)) {
            bParticle.isConnected = true;
        } else {
            this.bParticles.push(bParticle.name);
        }
    }
    randomNumber(min, max) {
        return Math.random() * (max - min) + min;
    }
    drawLine(p, color) {
        this.ctx.strokeStyle = color;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
       // this.ctx.shadowBlur = this.settings.line_blur;
        this.ctx.shadowColor = color;
        this.ctx.lineWidth = this.settings.line_width;
        this.ctx.beginPath();
        this.ctx.moveTo(p.pax, p.pay);
        this.ctx.lineTo(p.pbx, p.pby);
        this.ctx.stroke();
    }
    drawConnectingLine(aP, bP, distance) {
        let opacity = 1;
        var particlePosition = {
            ap: aP,
            bp: bP,
            pay: aP.y,
            pax: aP.x,
            pby: bP.y,
            pbx: bP.x
        }
        opacity = 1 - (distance / this.settings.connect_distance);
        if(aP.global_alpha && opacity > aP.global_alpha){
            opacity = aP.global_alpha;
        }
        let color = 'rgba(' + this.settings.line_color.join() + "," + opacity + ')';
        this.drawLine(particlePosition, color);
    }
    calculateIfNeedsConnected() {
        this.aParticles = [];
        this.bParticles = [];
        for (let a = 0; a < this.connectionParticles.length; a++) {
            for (let b = a; b < this.connectionParticles.length; b++) {
                let aParticle = this.connectionParticles[a];
                let bParticle = this.connectionParticles[b];
                bParticle.isConnected = false;
                let p1 = aParticle.x - bParticle.x;
                let p2 = aParticle.y - bParticle.y;
                let distance = (p1 * p1) + (p2 * p2);
                if (distance < this.settings.connect_distance) {
                    this.changeParticleOpacityOnConnect(aParticle, bParticle);
                    this.drawConnectingLine(aParticle, bParticle, distance);
                }
            }
        }

        this.cParticles = [];
        this.dParticles = [];
        for (let a = 0; a < this.randomParticles.length; a++) {
            for (let b = a; b < this.randomParticles.length; b++) {
                let cParticle = this.randomParticles[a];
                let dParticle = this.randomParticles[b];
                dParticle.isConnected = false;
                let p1 = cParticle.x - dParticle.x;
                let p2 = cParticle.y - dParticle.y;
                let distance = (p1 * p1) + (p2 * p2);
                if (distance < this.settings.connect_distance) {
                    this.changeParticleOpacityOnConnect(cParticle, dParticle);
                    this.drawConnectingLine(cParticle, dParticle, distance);
                }
            }
        }
    }
    createAnimationLoop(callback, manager) {
        var e = new AnimationLoop({
            fps: manager.settings.fps,
            callback: callback,
            manager: manager
        });
        e.animate(0);
    }
    createParticles() {
        this.connectionParticles = [];
        this.settings.global_alpha = false;
        for (let i = 0; i < this.settings.particles; i++) {
            this.connectionParticles.push(new Particle(this.settings, 'particle' + i, this));
        }

        if(!this.settings.add_bg_particles){return;}
        
        this.randomParticles = [];
        for (let i = 0; i < this.settings.particles/2; i++) {
            this.randomParticles.push(new Particle({
                min_size: 1,
                max_size: 2,
                color: [10,10,10],
                global_alpha: 0.08
            }, 'random' + i, this));
        }
    }
    init() {
        this.createParticles();
        this.createAnimationLoop(function(manager) {
            manager.clearRect();
            manager.connectParticles();
            manager.animateParticles();
        }, this);
        return this;
    };
}