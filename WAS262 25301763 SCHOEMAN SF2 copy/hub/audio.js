window.gameAudio = (() => {

    // Background music, one looping track per area
    const MUSIC = {
        hub: new Audio("../sounds/hubsong.mp3"),
        town: new Audio("../sounds/normalsong.mp3"),
        flood: new Audio("../sounds/floodsong.mp3"),
        snow: new Audio("../sounds/wintersong.mp3")
    };

    // Short one-shot sound effects (file paths, not Audio objects)
    const SFX = {
        pickup: "../sounds/Pickup_sfx.mp3",
        deliver: "../sounds/Deliver_sfx.mp3",
        timesUp: "../sounds/TimesUp_sfx.mp3",
        splash: "../sounds/Splash_sfx.mp3",
        battery: "../sounds/battery_sfx.mp3"
    };

    // Weather loops that play underneath the music
    const AMBIENT = {
        rain: new Audio("../sounds/Rain_sfx.mp3"),
        wind: new Audio("../sounds/Wind_sfx.mp3")
    };

    for (const track of Object.values(MUSIC)) {
        track.loop = true;
        track.volume = 0.4;
    }

    for (const track of Object.values(AMBIENT)) {
        track.loop = true;
        track.volume = 0.3;
    }

    AMBIENT.rain.volume = 0.8;

    let currentMusic = null;
    let loopingSfx = null;

    function playMusic(name) {
        stopMusic();
        currentMusic = MUSIC[name] || null;
        if (currentMusic) {
            currentMusic.currentTime = 0;
            currentMusic.play().catch(() => { });
        }
    }

    function stopMusic() {
        if (currentMusic) {
            currentMusic.pause();
        }
        currentMusic = null;
    }

    function play(name, times = 1) {
        if (!SFX[name]) return;

        if (times > 1 && loopingSfx) {
            loopingSfx.pause();
            loopingSfx = null;
        }

        const sound = new Audio(SFX[name]);
        sound.volume = 0.7;
        let remaining = Math.max(1, times);

        const playOnce = () => {
            remaining--;
            sound.currentTime = 0;
            sound.play().catch(() => { });
        };

        if (remaining > 1) {
            loopingSfx = sound;
            sound.addEventListener("ended", () => {
                if (remaining > 0) {
                    playOnce();
                } else if (loopingSfx === sound) {
                    loopingSfx = null;
                }
            });
        }

        playOnce();
    }

    function startAmbient(name) {
        const track = AMBIENT[name];
        if (track) {
            track.play().catch(() => { });
        }
    }

    function stopAmbient() {
        for (const track of Object.values(AMBIENT)) {
            track.pause();
            track.currentTime = 0;
        }
    }

    function stopAll() {
        stopMusic();
        stopAmbient();
        if (loopingSfx) {
            loopingSfx.pause();
            loopingSfx = null;
        }
    }

    return { playMusic, stopMusic, play, startAmbient, stopAmbient, stopAll };

})();