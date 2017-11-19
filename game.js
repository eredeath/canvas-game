var game = (function () {
    canvas = document.getElementById("game_canvas");
    ctx = canvas.getContext("2d");
    ctx.font = '12px serif';
    FPS = 30;
    var CW = canvas.width;
    var CH = canvas.height;
    var pw = 34, ph = 50;
    var dirx = 1;
    var diry = 1;
    var playerBullets = [];
    var enemies = [];
    var players = [];
    var game_started = false;
    var pause_clear = false;

    var jet_image = new Image();
    jet_image.src = "./jet.png";

    var keymap = new Map();
    keymap.set("left", false);
    keymap.set("right", false);
    keymap.set("down", false);
    keymap.set("up", false);
    keymap.set("space", false);
    keymap.set("enter", false);

    function Bullet(I) {
        I.active = true;
        I.xVelocity = 0;
        I.yVelocity = -I.speed;
        I.width = 3;
        I.height = 3;
        I.color = "#000";

        I.inBounds = function () {
            return I.x >= 0 && I.x <= CW && I.y >= 0 && I.y <= CH;
        }

        I.draw = function () {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        I.update = function () {
            I.x += I.xVelocity;
            I.y += I.yVelocity;

            I.active = I.active && I.inBounds();
        };

        return I;
    }

    function collide(a, b) {
        let p1 = {
            left: a.x,
            top: a.y,
            right: a.x + a.width,
            bottom: a.y + a.height,
        }
        let p2 =
            {
                left: b.x,
                top: b.y,
                right: b.x + b.width,
                bottom: b.y + b.height,
            }
        if (!(p2.left > p1.right ||
            p2.right < p1.left) &&
            !(p2.top > p1.bottom ||
                p2.bottom < p1.top)) {
            return true;
        }
        return false;
    }

    function Player(I) {
        I = I || {};
        I.active = true;
        I.x = CW / 2 - pw / 2;
        I.y = CH / 2 - ph / 2;
        I.image = jet_image;
        I.color = 'rgba(0,0,200,0.5';
        I.speed = 8;
        I.spd = clamp(I.speed, 1, 8);
        I.width = pw;
        I.height = ph;
        I.lives = 3;
        I.number = 1;
        I.inBounds = function () {
            return I.x >= 0 && I.x <= CW && I.y >= 0 && I.y <= CH;
        };
        I.draw = function () {
            ctx.drawImage(jet_image, I.x, I.y);
        };
        I.update = function () {
            I.active = I.active && I.inBounds();
            if (I.active) {
                for (let press of keymap) {
                    switch (press[0]) {
                        case "left":
                            if (press[1])
                                I.x -= I.speed;
                            break;
                        case "right":
                            if (press[1])
                                I.x += I.speed;
                            break;
                        case "up":
                            if (press[1])
                                I.y -= I.speed;
                            break;
                        case "down":
                            if (press[1])
                                I.y += I.speed;
                            break;
                        case "space":
                            if (press[1])
                                I.shoot();
                            break;
                    }
                }
            }
            I.x = clamp(I.x, 0, CW - pw + 1);
            I.y = clamp(I.y, 0, CH - ph + 1);
        };
        I.midpoint = function () {
            return {
                x: this.x + this.width / 2,
                y: this.y + this.height / 2
            };
        };
        I.shoot = function () {
            var bulletPos = I.midpoint();
            playerBullets.push(Bullet({
                speed: clamp(5 - players.length, 1, 4),
                x: bulletPos.x,
                y: I.y
            }));
        };
        return I;
    };

    function Enemy(I) {
        I = I || {};
        I.active = true;
        I.age = Math.floor(Math.random() * 128);

        I.x = Math.random() * CW
        I.y = 0;
        I.xVelocity = 0;
        I.yVelocity = 2;
        I.width = 32;
        I.height = 32;
        I.color = "#A2B";

        I.inBounds = function () {
            return I.x >= 0 && I.x <= CW && I.y >= 0 && I.y <= CH;
        }

        I.draw = function () {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        I.update = function () {
            I.x += I.xVelocity;
            I.y += I.yVelocity;

            I.xVelocity = 3 * Math.sin(I.age * Math.PI / 64);
            I.age++;

            I.active = I.active && I.inBounds();
        };

        return I;
    };

    function clamp(current, min, max) {
        if (current <= min) {
            current = min;
        }
        else if (current >= max) {
            current = max;
        }
        return current;
    }

    function update() {
        playerBullets.forEach(function (bullet) {
            bullet.update();
        });
        playerBullets = playerBullets.filter(function (bullet) {
            return bullet.active;
        });

        enemies.forEach(function (enemy) {
            playerBullets.forEach(function (bullet) {
                if (collide(bullet, enemy)) {
                    enemy.active = false;
                    bullet.active = false;
                }
            })

            enemy.update();
        })
        enemies = enemies.filter(function (enemy) {
            return enemy.active;
        })
        if (Math.random() < 0.3 && game_started) {
            enemies.push(Enemy());
        };

        players.forEach(function (player) {
            let update_speed = false;
            enemies.forEach(function (enemy) {
                if (collide(enemy, player)) {
                    if (player.lives == 1)
                        player.active = false;
                    else {
                        player.x = CW / 2 - pw / 2;
                        player.y = CH / 2 - ph / 2;
                        --player.lives
                        ctx.fillStyle = "red"
                        ctx.fillRect(0, 0, CW, CH)
                        pause_clear = true;
                    }
                    enemy.active = false;
                    update_speed = true;
                }
                if (update_speed) {
                    player.speed += 1;
                    update_speed = false;
                }
            });
            player.update();
        });
        players = players.filter(function (player) {
            return player.active;
        });
        if (players.length == 0) {
            game_started = false;
            enemies.forEach(function (enemy) {
                enemy.yVelocity = enemy.yVelocity * 1.5
            })
        }

    };

    function draw() {
        if (!pause_clear)
            ctx.clearRect(0, 0, CW, CH);
        var num_of_players = players.length;
        playerBullets.forEach(function (bullet) {
            bullet.draw();
        });
        enemies.forEach(function (enemy) {
            enemy.draw();
        });
        if (num_of_players > 0 && !pause_clear)
            players.forEach(function (player) {
                ctx.textAlign = "left"
                ctx.font = '12px serif';
                ctx.fillStyle = "black"
                ctx.fillText('Player ' + player.number + 'lives: ' +
                    player.lives, 5, (15 * (player.number - 1)) + 15);
                player.draw();
            })
        else {
            ctx.font = '48px serif';
            ctx.fillStyle = "red"
            ctx.textAlign = "center"
            ctx.fillText('Game Over', CW / 2, CH / 2);
            ctx.font = '12px serif';
            ctx.fillStyle = "black"
            ctx.fillText('Press "Enter" to start new game', CW / 2, CH / 2 + 15);
        }
        pause_clear = false;
    };

    setInterval(function () {
        update();
        draw();
    },
        1000 / FPS
    );

    canvas.addEventListener("keyup", function (e) {
        e = e || window.event;
        var release = e.key || e.keycode;
        switch (release) {
            case "ArrowLeft":
                keymap.set("left", false);
                break;
            case "ArrowRight":
                keymap.set("right", false);
                break;
            case "ArrowUp":
                keymap.set("up", false);
                break;
            case "ArrowDown":
                keymap.set("down", false);
                break;
            case " ":
                keymap.set("space", false);
                break;
        }
    });

    canvas.addEventListener("keydown", function (e) {
        e = e || window.event;
        var press = e.key || e.keycode;
        switch (press) {
            case "ArrowLeft":
                keymap.set("left", true);
                break;
            case "ArrowRight":
                keymap.set("right", true);
                break;
            case "ArrowUp":
                keymap.set("up", true);
                break;
            case "ArrowDown":
                keymap.set("down", true);
                break;
            case " ":
                keymap.set("space", true);
                break;
            case "Enter":
                if (players.length == 0 && enemies.length == 0) {
                    players.push(Player());
                    players.forEach(function (player) {
                        player.speed -= 1;
                    });
                    game_started = true;
                }
                break;
        }
    });

    return {
        draw: function () {
            player.draw();
        },
    };
})()

