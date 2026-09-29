
//test dialogue for the console//
console.log("=================================");
console.log("SNOW TOWN DELIVERY JS HAS LOADED");
console.log("=================================");

window.snowTownGame = (() => {

    //game settings//
    const GAME_DURATION = 60;

    const TOWN_PLAYER_SPEED = 900;
    const TOWN_PLAYER_ACCELERATION = 600;

    // Normal traction
    const NORMAL_DRAG = 0.95;

    // Ice has much less friction
    const ICE_DRAG = 0.995;

    const MAX_BATTERY = 100;
    const ENERGY_CONSUMPTION = 8;

    const DELIVERY_SCORE = 100;

    // Wind
    const WIND_FORCE = 180;
    const WIND_CHANGE_MIN = 4;
    const WIND_CHANGE_MAX = 8;

    // Snow
    const SNOW_PARTICLE_COUNT = 180;

    //gametstate
    let timeRemaining = GAME_DURATION;

    let gameState = "playing";

    let deliveries = 0;

    let score = 0;

    let teleportMessage = "";
    let teleportMessageTimer = 0;


    //wind state//
    let windDirection = {
        x: 1,
        y: 0
    };

    let windTimer = 5;

    let windStrength = WIND_FORCE;


    //buildings
    const buildings = [

        // TOP ROW

        {
            x: 40,
            y: 65,
            width: 170,
            height: 100,
            recharge: false
        },

        {
            x: 255,
            y: 65,
            width: 170,
            height: 100,
            recharge: false
        },

        {
            x: 470,
            y: 65,
            width: 170,
            height: 100,
            recharge: false
        },

        {
            x: 685,
            y: 65,
            width: 170,
            height: 100,
            recharge: false
        },


        // BOTTOM ROW

        {
            x: 40,
            y: 300,
            width: 170,
            height: 100,
            recharge: false
        },

        {
            x: 255,
            y: 300,
            width: 170,
            height: 100,
            recharge: false
        },

        {
            x: 470,
            y: 300,
            width: 170,
            height: 100,
            recharge: false
        },


        // RECHARGE BUILDING

        {
            x: 685,
            y: 300,
            width: 170,
            height: 100,
            recharge: true
        }
    ];


    //roads//
    const roads = [

        // Horizontal roads

        {
            x: 0,
            y: 0,
            width: 900,
            height: 40
        },

        {
            x: 0,
            y: 205,
            width: 900,
            height: 60
        },

        {
            x: 0,
            y: 440,
            width: 900,
            height: 60
        },


        // Vertical roads

        {
            x: 0,
            y: 0,
            width: 25,
            height: 500
        },

        {
            x: 210,
            y: 0,
            width: 45,
            height: 500
        },

        {
            x: 425,
            y: 0,
            width: 45,
            height: 500
        },

        {
            x: 640,
            y: 0,
            width: 45,
            height: 500
        },

        {
            x: 855,
            y: 0,
            width: 45,
            height: 500
        }
    ];


    //collision//
    function isTownColliding(a, b) {

        return (

            a.x < b.x + b.width &&

            a.x + a.width > b.x &&

            a.y < b.y + b.height &&

            a.y + a.height > b.y
        );
    }


    //snow particles//
    const snowParticles = [];

    function createSnowParticle() {

        return {

            x: Math.random() * 900,

            y: Math.random() * 500,

            size: Math.random() * 3 + 1,

            speed: Math.random() * 60 + 30,

            drift: Math.random() * 30 - 15,

            opacity: Math.random() * 0.6 + 0.4
        };
    }


    function initializeSnow() {

        snowParticles.length = 0;

        for (
            let i = 0;
            i < SNOW_PARTICLE_COUNT;
            i++
        ) {

            snowParticles.push(
                createSnowParticle()
            );
        }
    }


    function updateSnow(deltaTime) {

        for (const snow of snowParticles) {

            snow.y +=
                snow.speed *
                deltaTime;

            snow.x +=
                snow.drift *
                deltaTime;


            // Wrap around screen

            if (snow.y > 500) {

                snow.y = -5;

                snow.x =
                    Math.random() * 900;
            }


            if (snow.x > 900) {

                snow.x = 0;
            }

            if (snow.x < 0) {

                snow.x = 900;
            }
        }
    }


    //ice puddles//
    const icePuddles = [

        {
            x: 70,
            y: 215,
            width: 100,
            height: 35
        },

        {
            x: 285,
            y: 215,
            width: 90,
            height: 30
        },

        {
            x: 500,
            y: 225,
            width: 100,
            height: 25
        },

        {
            x: 720,
            y: 215,
            width: 90,
            height: 35
        },

        {
            x: 120,
            y: 450,
            width: 100,
            height: 30
        },

        {
            x: 330,
            y: 455,
            width: 80,
            height: 25
        },

        {
            x: 555,
            y: 450,
            width: 110,
            height: 30
        }
    ];


    function isPlayerOnIce() {

        for (const puddle of icePuddles) {

            if (
                isTownColliding(
                    townPlayer,
                    puddle
                )
            ) {

                return true;
            }
        }

        return false;
    }


    //player vehilce//
    class PlayerVehicle {

        constructor(x, y) {

            this.x = x;
            this.y = y;

            this.width = 32;
            this.height = 24;

            this.vx = 0;
            this.vy = 0;

            this.angle = 0;

            this.acceleration =
                TOWN_PLAYER_ACCELERATION;

            this.maxSpeed =
                TOWN_PLAYER_SPEED;

            this.drag =
                NORMAL_DRAG;

            this.battery =
                MAX_BATTERY;

            this.maxBattery =
                MAX_BATTERY;

            this.energyConsumption =
                ENERGY_CONSUMPTION;

            this.carryingPackage =
                false;
        }


        //input//
        getInputDirection() {

            let dx = 0;
            let dy = 0;


            // WASD

            if (keys.has("w"))
                dy -= 1;

            if (keys.has("s"))
                dy += 1;

            if (keys.has("a"))
                dx -= 1;

            if (keys.has("d"))
                dx += 1;


            // Arrow keys

            if (keys.has("arrowup"))
                dy -= 1;

            if (keys.has("arrowdown"))
                dy += 1;

            if (keys.has("arrowleft"))
                dx -= 1;

            if (keys.has("arrowright"))
                dx += 1;


            // Normalize diagonal movement

            const length =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );


            if (length > 0) {

                dx /= length;
                dy /= length;
            }


            return {
                x: dx,
                y: dy
            };
        }


        //update//
        update(deltaTime) {

            const input =
                this.getInputDirection();


            const moving =
                input.x !== 0 ||
                input.y !== 0;


            //player direction//
            if (moving) {

                this.angle =
                    Math.atan2(
                        input.y,
                        input.x
                    );


                const directionX =
                    Math.cos(
                        this.angle
                    );

                const directionY =
                    Math.sin(
                        this.angle
                    );


                // Acceleration

                this.vx +=
                    directionX *
                    this.acceleration *
                    deltaTime;

                this.vy +=
                    directionY *
                    this.acceleration *
                    deltaTime;
            }


            //force of wind//
            this.vx +=
                windDirection.x *
                windStrength *
                deltaTime;

            this.vy +=
                windDirection.y *
                windStrength *
                deltaTime;


            //limit speed/
            const speed =
                Math.sqrt(
                    this.vx * this.vx +
                    this.vy * this.vy
                );


            if (speed > this.maxSpeed) {

                const scale =
                    this.maxSpeed /
                    speed;

                this.vx *= scale;
                this.vy *= scale;
            }


            //move
            this.moveWithCollision(

                this.vx * deltaTime,

                this.vy * deltaTime
            );


            //ice traction//
            const onIce =
                isPlayerOnIce();


            if (onIce) {

                // Very little friction.
                // Vehicle slides significantly.

                this.vx *= Math.pow(
                    ICE_DRAG,
                    deltaTime * 60
                );

                this.vy *= Math.pow(
                    ICE_DRAG,
                    deltaTime * 60
                );

            } else {

                // Normal road traction.

                this.vx *= Math.pow(
                    NORMAL_DRAG,
                    deltaTime * 60
                );

                this.vy *= Math.pow(
                    NORMAL_DRAG,
                    deltaTime * 60
                );
            }


            //battery
            if (
                moving &&
                this.battery > 0
            ) {

                this.battery -=
                    this.energyConsumption *
                    deltaTime;


                if (this.battery <= 0) {

                    this.battery = 0;

                    teleportMessage =
                        "Solar Reserve empty! Returning to Microgrid...";

                    teleportMessageTimer = 3;

                    this.returnToChargingZone();
                }
            }


            //canvas boundaries//
            this.x =
                Math.max(
                    0,
                    Math.min(
                        900 - this.width,
                        this.x
                    )
                );


            this.y =
                Math.max(
                    0,
                    Math.min(
                        500 - this.height,
                        this.y
                    )
                );
        }


        //movement wiht collision
        moveWithCollision(dx, dy) {

            // Horizontal

            const nextX = {

                x: this.x + dx,

                y: this.y,

                width: this.width,

                height: this.height
            };


            if (
                !this.collidesWithBuilding(
                    nextX
                )
            ) {

                this.x += dx;

            } else {

                this.vx = 0;
            }


            // Vertical

            const nextY = {

                x: this.x,

                y: this.y + dy,

                width: this.width,

                height: this.height
            };


            if (
                !this.collidesWithBuilding(
                    nextY
                )
            ) {

                this.y += dy;

            } else {

                this.vy = 0;
            }
        }


        //collision
        collidesWithBuilding(rect) {

            for (
                const building of buildings
            ) {

                if (
                    !isTownColliding(
                        rect,
                        building
                    )
                ) {

                    continue;
                }


                // Recharge building opening

                if (building.recharge) {

                    const door = {

                        x:
                            building.x +
                            building.width / 2 -
                            25,

                        y:
                            building.y +
                            building.height -
                            10,

                        width: 50,

                        height: 20
                    };


                    if (
                        isTownColliding(
                            rect,
                            door
                        )
                    ) {

                        continue;
                    }
                }


                return true;
            }


            return false;
        }


        //teleport//
        returnToChargingZone() {

            gameAudio.play("battery");

            const zone =
                getRechargeZone();


            this.x =
                zone.x +
                zone.width / 2 -
                this.width / 2;


            this.y =
                zone.y +
                zone.height / 2 -
                this.height / 2;


            this.vx = 0;
            this.vy = 0;


            this.battery =
                this.maxBattery;


            this.angle = 0;


            teleportMessage =
                "Solar Reserve empty! Recharged at the Microgrid.";

            teleportMessageTimer = 3;
        }


        //reset//
        reset(x, y) {

            this.x = x;
            this.y = y;

            this.vx = 0;
            this.vy = 0;

            this.angle = 0;

            this.battery =
                this.maxBattery;

            this.carryingPackage =
                false;
        }


        //draw//
        draw(context) {

            context.save();


            context.translate(

                this.x +
                this.width / 2,

                this.y +
                this.height / 2
            );


            context.rotate(
                this.angle
            );


            // Vehicle body

            context.fillStyle =
                this.carryingPackage
                    ? "#e91e63"
                    : "#2196f3";


            context.fillRect(

                -this.width / 2,

                -this.height / 2,

                this.width,

                this.height
            );


            // Front indicator

            context.fillStyle =
                "white";


            context.fillRect(

                this.width / 2 - 4,

                -5,

                4,

                10
            );


            // Snow cap on vehicle

            context.fillStyle =
                "white";


            context.fillRect(

                -this.width / 2 + 3,

                -this.height / 2,

                this.width - 6,

                4
            );


            context.restore();
        }
    }


    //player//
    const townPlayer =
        new PlayerVehicle(
            120,
            220
        );


    //delivery points//
    const deliveryPoints = [];


    for (
        const building of buildings
    ) {

        if (
            !building.recharge
        ) {

            deliveryPoints.push({

                x:
                    building.x +
                    building.width / 2 -
                    20,

                y:
                    building.y +
                    building.height +
                    10,

                width: 40,

                height: 25,

                building: building
            });
        }
    }


    //package//
    const packageItem = {

        x: 200,

        y: 300,

        width: 18,

        height: 18,

        collected: false,

        destination: null
    };


    //package position//
    function isValidPackagePosition(
        x,
        y
    ) {

        const test = {

            x: x,

            y: y,

            width:
                packageItem.width,

            height:
                packageItem.height
        };


        // Cannot spawn inside buildings

        for (
            const building of buildings
        ) {

            if (
                isTownColliding(
                    test,
                    building
                )
            ) {

                return false;
            }
        }


        // Must be on road

        let onRoad = false;


        for (
            const road of roads
        ) {

            if (
                isTownColliding(
                    test,
                    road
                )
            ) {

                onRoad = true;

                break;
            }
        }


        return onRoad;
    }


    //respawn//
    function respawnPackage() {

        let attempts = 0;


        while (
            attempts < 100
        ) {

            const road =
                roads[
                Math.floor(
                    Math.random() *
                    roads.length
                )
                ];


            const x =
                road.x +
                Math.random() *
                Math.max(
                    1,
                    road.width -
                    packageItem.width
                );


            const y =
                road.y +
                Math.random() *
                Math.max(
                    1,
                    road.height -
                    packageItem.height
                );


            if (
                isValidPackagePosition(
                    x,
                    y
                )
            ) {

                packageItem.x = x;
                packageItem.y = y;

                packageItem.collected =
                    false;

                packageItem.destination =
                    null;

                return;
            }


            attempts++;
        }


        packageItem.x = 200;
        packageItem.y = 220;

        packageItem.collected =
            false;

        packageItem.destination =
            null;
    }


    //recharge//
    function getRechargeZone() {

        const building =
            buildings.find(
                b => b.recharge
            );


        return {

            x:
                building.x +
                building.width / 2 -
                40,

            y:
                building.y +
                building.height +
                5,

            width: 80,

            height: 35
        };
    }


    //pick up package//
    function checkPackagePickup() {

        if (
            packageItem.collected
        ) {

            return;
        }


        if (
            isTownColliding(
                townPlayer,
                packageItem
            )
        ) {

            packageItem.collected =
                true;

            townPlayer.carryingPackage =
                true;

            gameAudio.play("pickup");

            const available =
                deliveryPoints.filter(
                    point =>
                        point !==
                        packageItem.destination
                );


            if (
                available.length > 0
            ) {

                packageItem.destination =
                    available[
                    Math.floor(
                        Math.random() *
                        available.length
                    )
                    ];
            }
        }
    }


    //delivery//
    function checkDelivery() {

        if (
            !packageItem.collected ||
            !packageItem.destination
        ) {

            return;
        }


        if (
            isTownColliding(
                townPlayer,
                packageItem.destination
            )
        ) {

            deliveries++;

            score += DELIVERY_SCORE;

            gameAudio.play("deliver");

            packageItem.collected =
                false;

            packageItem.destination =
                null;


            townPlayer.carryingPackage =
                false;


            respawnPackage();
        }
    }


    //recharging
    function checkRecharge(
        deltaTime
    ) {

        const zone =
            getRechargeZone();


        if (
            isTownColliding(
                townPlayer,
                zone
            )
        ) {

            townPlayer.battery =
                Math.min(

                    townPlayer.maxBattery,

                    townPlayer.battery +
                    30 *
                    deltaTime
                );
        }
    }


    //wind//
    function changeWindDirection() {

        const angle =
            Math.random() *
            Math.PI *
            2;


        windDirection.x =
            Math.cos(angle);


        windDirection.y =
            Math.sin(angle);


        windStrength =
            WIND_FORCE *
            (
                0.7 +
                Math.random() *
                0.6
            );


        windTimer =
            WIND_CHANGE_MIN +
            Math.random() *
            (
                WIND_CHANGE_MAX -
                WIND_CHANGE_MIN
            );
    }


    function updateWind(
        deltaTime
    ) {

        windTimer -=
            deltaTime;


        if (
            windTimer <= 0
        ) {

            changeWindDirection();
        }
    }


    //update//
    function update(deltaTime) {

        if (
            gameState !== "playing"
        ) {

            return;
        }


        // Timer

        timeRemaining -=
            deltaTime;


        if (
            timeRemaining <= 0
        ) {

            timeRemaining = 0;

            gameState =
                "timesUp";

            gameAudio.stopAll();
            gameAudio.play("timesUp");

            return;
        }


        // Snow

        updateSnow(
            deltaTime
        );


        // Wind

        updateWind(
            deltaTime
        );


        // Player

        townPlayer.update(
            deltaTime
        );


        // Interactions

        checkPackagePickup();

        checkDelivery();

        checkRecharge(
            deltaTime
        );


        // Message timer

        if (
            teleportMessageTimer > 0
        ) {

            teleportMessageTimer -=
                deltaTime;


            if (
                teleportMessageTimer <= 0
            ) {

                teleportMessage = "";
            }
        }
    }


    //background//
    function drawTownBackground(
        context
    ) {

        // Snow-covered grass

        context.fillStyle =
            "#dcecf7";

        context.fillRect(
            0,
            0,
            900,
            500
        );


        // Roads

        context.fillStyle =
            "#78828a";


        for (
            const road of roads
        ) {

            context.fillRect(

                road.x,

                road.y,

                road.width,

                road.height
            );
        }


        // Snow along road edges

        context.fillStyle =
            "#ffffff";


        for (
            const road of roads
        ) {

            if (
                road.width >
                road.height
            ) {

                context.fillRect(
                    road.x,
                    road.y,
                    road.width,
                    5
                );


                context.fillRect(
                    road.x,
                    road.y +
                    road.height -
                    5,
                    road.width,
                    5
                );

            } else {

                context.fillRect(
                    road.x,
                    road.y,
                    5,
                    road.height
                );


                context.fillRect(
                    road.x +
                    road.width -
                    5,
                    road.y,
                    5,
                    road.height
                );
            }
        }


        // Road markings

        context.strokeStyle =
            "#dfe7ec";

        context.lineWidth = 2;

        context.setLineDash([
            15,
            15
        ]);


        for (
            const road of roads
        ) {

            if (
                road.width >
                road.height
            ) {

                context.beginPath();

                context.moveTo(
                    road.x,
                    road.y +
                    road.height / 2
                );

                context.lineTo(
                    road.x +
                    road.width,
                    road.y +
                    road.height / 2
                );

                context.stroke();
            }
        }


        context.setLineDash([]);
    }


    //buildings//
    function drawBuildings(
        context
    ) {

        for (
            const building of buildings
        ) {

            // Building body

            context.fillStyle =
                building.recharge
                    ? "#5b88b2"
                    : "#9b7653";


            context.fillRect(

                building.x,

                building.y,

                building.width,

                building.height
            );


            // Snow-covered roof

            context.fillStyle =
                building.recharge
                    ? "#3f6486"
                    : "#76583e";


            context.fillRect(

                building.x,

                building.y,

                building.width,

                25
            );


            // Snow on roof

            context.fillStyle =
                "#ffffff";


            context.fillRect(

                building.x - 3,

                building.y - 5,

                building.width + 6,

                8
            );


            // Windows

            context.fillStyle =
                "#c9ecff";


            const windowY =
                building.y + 40;


            for (
                let i = 0;
                i < 3;
                i++
            ) {

                context.fillRect(

                    building.x +
                    20 +
                    i * 50,

                    windowY,

                    30,

                    25
                );
            }


            // Door

            context.fillStyle =
                "#4b2e1f";


            context.fillRect(

                building.x +
                building.width / 2 -
                20,

                building.y +
                building.height -
                45,

                40,

                45
            );


            // Microgrid label

            if (
                building.recharge
            ) {

                context.fillStyle =
                    "white";

                context.font =
                    "bold 16px Arial";

                context.textAlign =
                    "center";


                context.fillText(

                    "SOLAR MICROGRID",

                    building.x +
                    building.width / 2,

                    building.y + 20
                );
            }
        }
    }


    //ice puddles//
    function drawIcePuddles(
        context
    ) {

        for (
            const puddle of icePuddles
        ) {

            context.save();


            // Soft shadow

            context.fillStyle =
                "rgba(80, 150, 200, 0.25)";


            context.fillRect(

                puddle.x - 3,

                puddle.y + 3,

                puddle.width + 6,

                puddle.height + 4
            );


            // Ice

            context.fillStyle =
                "rgba(150, 225, 255, 0.75)";


            context.fillRect(

                puddle.x,

                puddle.y,

                puddle.width,

                puddle.height
            );


            // Ice highlights

            context.strokeStyle =
                "rgba(255,255,255,0.9)";

            context.lineWidth = 2;


            context.beginPath();

            context.moveTo(
                puddle.x + 10,
                puddle.y + 8
            );

            context.lineTo(
                puddle.x + puddle.width - 15,
                puddle.y + 5
            );

            context.stroke();


            context.restore();
        }
    }


    //delivery points//
    function drawDeliveryPoints(
        context
    ) {

        for (
            const point of deliveryPoints
        ) {

            const isTarget =
                packageItem.collected &&
                packageItem.destination ===
                point;


            if (isTarget) {

                const pulse =
                    (
                        Math.sin(
                            performance.now() /
                            150
                        ) + 1
                    ) / 2;


                context.save();


                context.shadowBlur =
                    10 +
                    pulse * 15;


                context.shadowColor =
                    "#fff200";


                context.fillStyle =
                    pulse > 0.5
                        ? "#fff200"
                        : "#ffb300";


                context.fillRect(

                    point.x,

                    point.y,

                    point.width,

                    point.height
                );


                context.restore();


                context.fillStyle =
                    "#222";

                context.font =
                    "bold 12px Arial";

                context.textAlign =
                    "center";


                context.fillText(

                    "DELIVER HERE",

                    point.x +
                    point.width / 2,

                    point.y + 17
                );

            } else {

                context.fillStyle =
                    "#ffd700";


                context.fillRect(

                    point.x,

                    point.y,

                    point.width,

                    point.height
                );


                context.strokeStyle =
                    "#8b6508";


                context.strokeRect(

                    point.x,

                    point.y,

                    point.width,

                    point.height
                );


                context.fillStyle =
                    "#333";


                context.font =
                    "bold 12px Arial";


                context.textAlign =
                    "center";


                context.fillText(

                    "DELIVER",

                    point.x +
                    point.width / 2,

                    point.y + 17
                );
            }
        }
    }


    //package//
    function drawPackage(
        context
    ) {

        if (
            packageItem.collected
        ) {

            return;
        }


        context.fillStyle =
            "#f4c542";


        context.fillRect(

            packageItem.x,

            packageItem.y,

            packageItem.width,

            packageItem.height
        );


        context.strokeStyle =
            "#7a5c00";


        context.strokeRect(

            packageItem.x,

            packageItem.y,

            packageItem.width,

            packageItem.height
        );
    }

    //town player//
    function drawTownPlayer(
        context
    ) {

        townPlayer.draw(
            context
        );
    }


    //DRAWING SNOW PARTICLES//
    function drawSnow(
        context
    ) {

        context.save();


        for (
            const snow of snowParticles
        ) {

            context.globalAlpha =
                snow.opacity;


            context.fillStyle =
                "white";


            context.beginPath();


            context.arc(

                snow.x,

                snow.y,

                snow.size,

                0,

                Math.PI * 2
            );


            context.fill();
        }


        context.restore();
    }


    //wind hud//
    function drawWindIndicator(
        context
    ) {

        const centerX = 760;
        const centerY = 35;


        context.save();


        context.fillStyle =
            "rgba(0,0,0,0.75)";


        context.fillRect(
            690,
            10,
            190,
            55
        );


        context.fillStyle =
            "white";


        context.font =
            "bold 14px Arial";


        context.textAlign =
            "center";


        context.fillText(
            "WIND",
            centerX,
            27
        );


        // Arrow

        context.translate(
            centerX,
            46
        );


        const angle =
            Math.atan2(
                windDirection.y,
                windDirection.x
            );


        context.rotate(angle);


        context.strokeStyle =
            "#9ee8ff";


        context.fillStyle =
            "#9ee8ff";


        context.lineWidth = 4;


        context.beginPath();

        context.moveTo(
            -20,
            0
        );

        context.lineTo(
            20,
            0
        );

        context.stroke();


        context.beginPath();

        context.moveTo(
            20,
            0
        );

        context.lineTo(
            8,
            -8
        );

        context.lineTo(
            8,
            8
        );

        context.closePath();

        context.fill();


        context.restore();


        // Wind strength

        context.fillStyle =
            "white";

        context.font =
            "12px Arial";

        context.textAlign =
            "right";


        context.fillText(

            "Wind force: " +
            Math.round(windStrength),

            875,
            60
        );
    }


    //ice warning//
    function drawIceWarning(
        context
    ) {

        if (
            !isPlayerOnIce()
        ) {

            return;
        }


        context.fillStyle =
            "rgba(50,150,255,0.85)";


        context.fillRect(
            330,
            455,
            240,
            30
        );


        context.fillStyle =
            "white";


        context.font =
            "bold 14px Arial";


        context.textAlign =
            "center";


        context.fillText(

            "⚠ ICY ROAD - LOW TRACTION",

            450,
            476
        );
    }



    //hud//
    function drawHUD(
        context
    ) {

        context.fillStyle =
            "rgba(0,0,0,0.75)";


        context.fillRect(
            10,
            10,
            250,
            75
        );


        context.fillStyle =
            "white";


        context.font =
            "bold 18px Arial";


        context.textAlign =
            "left";


        context.fillText(

            `TIME: ${Math.ceil(timeRemaining)}`,

            20,
            35
        );


        context.fillText(

            `DELIVERIES: ${deliveries}`,

            20,
            58
        );


        context.fillText(

            `SCORE: ${score}`,

            20,
            81
        );


        // Battery

        const batteryX = 280;

        const batteryY = 20;

        const batteryWidth = 180;

        const batteryHeight = 20;


        context.fillStyle =
            "rgba(0,0,0,0.75)";


        context.fillRect(

            batteryX,

            batteryY,

            batteryWidth,

            batteryHeight
        );


        const batteryPercent =
            townPlayer.battery /
            townPlayer.maxBattery;


        context.fillStyle =
            batteryPercent > 0.5
                ? "#4caf50"
                : batteryPercent > 0.2
                    ? "#ffc107"
                    : "#f44336";


        context.fillRect(

            batteryX,

            batteryY,

            batteryWidth *
            batteryPercent,

            batteryHeight
        );


        context.strokeStyle =
            "white";


        context.strokeRect(

            batteryX,

            batteryY,

            batteryWidth,

            batteryHeight
        );


        context.fillStyle =
            "white";


        context.font =
            "bold 14px Arial";


        context.fillText(

            `SOLAR RESERVE: ${Math.ceil(townPlayer.battery)}%`,

            batteryX,

            batteryY + 40
        );
    }


    //teleport message//
    function drawTeleportMessage(
        context
    ) {

        if (
            !teleportMessage
        ) {

            return;
        }


        context.fillStyle =
            "rgba(0,0,0,0.8)";


        context.fillRect(
            250,
            430,
            400,
            45
        );


        context.fillStyle =
            "white";


        context.font =
            "bold 16px Arial";


        context.textAlign =
            "center";


        context.fillText(

            teleportMessage,

            450,
            458
        );
    }


    //time up//
    function drawTimesUpScreen(
        context
    ) {

        context.fillStyle =
            "rgba(0,0,0,0.75)";


        context.fillRect(
            0,
            0,
            900,
            500
        );


        context.fillStyle =
            "white";


        context.textAlign =
            "center";


        context.font =
            "bold 48px Arial";


        context.fillText(
            "TIME'S UP!",
            450,
            180
        );


        context.font =
            "24px Arial";


        context.fillText(

            `Deliveries: ${deliveries}`,

            450,
            240
        );


        context.fillText(

            `Score: ${score}`,

            450,
            280
        );


        context.font =
            "18px Arial";


        context.fillText(

            "Press ENTER to see your results",

            450,
            350
        );
    }

    //results//
    function drawResultsScreen(
        context
    ) {

        context.save();


        context.fillStyle =
            "rgba(0,0,0,0.75)";


        context.fillRect(
            0,
            0,
            900,
            500
        );


        context.fillStyle =
            "#ffffff";


        context.fillRect(
            250,
            100,
            400,
            300
        );


        context.strokeStyle =
            "#333";


        context.lineWidth = 4;


        context.strokeRect(
            250,
            100,
            400,
            300
        );


        context.fillStyle =
            "#222";


        context.font =
            "bold 32px Arial";


        context.textAlign =
            "center";


        context.fillText(

            "SNOW DELIVERY RESULTS",

            450,
            150
        );


        context.font =
            "bold 22px Arial";


        context.fillText(

            "Deliveries: " +
            deliveries,

            450,
            205
        );


        context.fillText(

            "Final Score: " +
            score,

            450,
            245
        );


        // Retry

        context.fillStyle =
            "#4CAF50";


        context.fillRect(
            320,
            275,
            260,
            50
        );


        context.strokeStyle =
            "#2e7d32";


        context.lineWidth = 2;


        context.strokeRect(
            320,
            275,
            260,
            50
        );


        context.fillStyle =
            "white";


        context.font =
            "bold 18px Arial";


        context.fillText(

            "R - RETRY SNOW DELIVERY",

            450,
            307
        );


        // Return

        context.fillStyle =
            "#555";


        context.fillRect(
            320,
            340,
            260,
            40
        );


        context.strokeStyle =
            "#333";


        context.strokeRect(
            320,
            340,
            260,
            40
        );


        context.fillStyle =
            "white";


        context.font =
            "bold 16px Arial";


        context.fillText(

            "H - RETURN TO HUB",

            450,
            366
        );


        context.restore();
    }


    //draw//
    function draw(context) {

        drawTownBackground(
            context
        );


        drawBuildings(
            context
        );


        drawIcePuddles(
            context
        );


        drawDeliveryPoints(
            context
        );


        drawPackage(
            context
        );


        drawTownPlayer(
            context
        );


        // Environmental overlays

        drawSnow(
            context
        );


        drawHUD(
            context
        );


        drawWindIndicator(
            context
        );


        drawIceWarning(
            context
        );


        drawTeleportMessage(
            context
        );


        if (
            gameState === "timesUp"
        ) {

            drawTimesUpScreen(
                context
            );
        }


        if (
            gameState === "results"
        ) {

            drawResultsScreen(
                context
            );
        }
    }


    //start restart//
    function restart() {

        timeRemaining =
            GAME_DURATION;


        gameState =
            "playing";


        deliveries = 0;

        score = 0;


        teleportMessage =
            "";


        teleportMessageTimer =
            0;


        townPlayer.reset(
            120,
            220
        );


        changeWindDirection();


        initializeSnow();


        respawnPackage();

        gameAudio.playMusic("snow");
        gameAudio.startAmbient("wind");
    }


    //results
    function showResults() {

        if (
            gameState ===
            "timesUp"
        ) {

            gameState =
                "results";
        }
    }



    return {

        start: restart,

        update: update,

        draw: draw,

        showResults:
            showResults,


        getState:
            function () {

                return gameState;
            },


        getResults:
            function () {

                return {

                    deliveries:
                        deliveries,

                    score:
                        score
                };
            }
    };

})();

