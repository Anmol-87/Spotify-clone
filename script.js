// ----------------- Globals -----------------
let currentSong = new Audio();
let currentIndex = 0;
let songs = [];
let currentFolder = "";
const leftPanel = document.querySelector(".left");

// ----------------- Fetch Songs -----------------
async function getSongs(folder) {
    currentFolder = folder;
    let songUL = document.querySelector(".songsList ul");

    // Fade out current list
    songUL.classList.add("fade-out");

    // Wait for fade-out transition
    await new Promise(resolve => setTimeout(resolve, 400));

    // Fetch new songs
    let a = await fetch(`/${folder}/`);
    let response = await a.text();

    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");

    songs = [];
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push({
                name: decodeURIComponent(element.href.split(`/${folder}/`)[1]),
                url: element.href
            });
        }
    }

    // Render new songs
    showSongs();

    // Fade in new list
    songUL.classList.remove("fade-out");
    songUL.classList.add("fade-in");

    // Remove fade-in after animation
    setTimeout(() => {
        songUL.classList.remove("fade-in");
    }, 400);
}

// ----------------- Render Songs with Sequential Fade -----------------
function showSongs() {
    let songUL = document.querySelector(".songsList ul");
    songUL.innerHTML = "";

    songs.forEach((song, index) => {
        let li = document.createElement("li");

        li.innerHTML = `
            <div class="song-left">
                <img class="music-svg" src="music.svg" alt="Music">
                <div class="song-info">
                    <div class="song-name">${song.name}</div>
                    <div class="song-artist">Unknown Artist</div>
                </div>
            </div>
            <div class="song-play">
                <img class="invert" src="play.svg" alt="play">
            </div>
        `;

        // Play song when clicked
        li.addEventListener("click", () => {
            playSong(index);
        });

        songUL.appendChild(li);

        // Sequential fade-in
        setTimeout(() => {
            li.classList.add("show");
        }, index * 100); // 100ms delay between items
    });
}

// ----------------- Play Song -----------------
function playSong(index) {
    // Pause current song
    if (!currentSong.paused) currentSong.pause();

    currentIndex = index;
    currentSong.src = songs[index].url;
    currentSong.play();

    document.querySelector("#play").src = "pause.svg";
    document.querySelector(".songinfo").innerText = songs[index].name;

    // Reset seekbar
    document.querySelector(".progress").style.width = "0%";
    document.querySelector(".circle").style.left = "0%";
}

// ----------------- Play / Pause -----------------
const playBtn = document.querySelector("#play");

playBtn.addEventListener("click", () => {
    if (currentSong.paused) {
        currentSong.play();
        playBtn.src = "pause.svg";
    } else {
        currentSong.pause();
        playBtn.src = "play.svg";
    }
});

// ----------------- Previous / Next -----------------
document.querySelector("#previous").addEventListener("click", () => {
    if (currentIndex > 0) playSong(currentIndex - 1);
});

document.querySelector("#next").addEventListener("click", () => {
    if (currentIndex < songs.length - 1) playSong(currentIndex + 1);
});

// ----------------- Auto-play Next Song -----------------
currentSong.addEventListener("ended", () => {
    if (currentIndex < songs.length - 1) {
        playSong(currentIndex + 1);
    }
});

// ----------------- Update Time & Seekbar -----------------
currentSong.addEventListener("timeupdate", () => {
    let current = formatTime(currentSong.currentTime);
    let total = formatTime(currentSong.duration);
    document.querySelector(".songtime").innerText = `${current} / ${total}`;

    let percent = (currentSong.currentTime / currentSong.duration) * 100;
    document.querySelector(".progress").style.width = percent + "%";
    document.querySelector(".circle").style.left = percent + "%";
});

// ----------------- Seekbar Control -----------------
const seekbar = document.querySelector(".seekbar");

seekbar.addEventListener("click", (e) => {
    let percent = (e.offsetX / seekbar.offsetWidth) * currentSong.duration;
    currentSong.currentTime = percent;
});

// ----------------- Format Time -----------------
function formatTime(seconds) {
    if (isNaN(seconds)) return "00:00";
    let mins = Math.floor(seconds / 60);
    let secs = Math.floor(seconds % 60);
    if (secs < 10) secs = "0" + secs;
    return `${mins}:${secs}`;
}

// ----------------- Load Songs on Card Click -----------------
document.querySelectorAll(".card").forEach(card => {
    const circle = card.querySelector(".play");

    // Circle click → auto-play first song
    circle.addEventListener("click", async (e) => {
        e.stopPropagation();
        let folder = `Songs/${card.dataset.folder}`;
        await getSongs(folder);

        if (songs.length > 0) playSong(0);

        // Open left panel automatically on mobile
        if (window.innerWidth <= 768) {
            leftPanel.classList.add("open");
        }
    });

    // Card click → just load songs
    card.addEventListener("click", async () => {
        let folder = `Songs/${card.dataset.folder}`;
        await getSongs(folder);

        // Open left panel automatically on mobile
        if (window.innerWidth <= 768) {
            leftPanel.classList.add("open");
        }
    });
});

// ----------------- Hamburger Menu -----------------
const hamburger = document.querySelector(".hamburger");
const closeBtn = document.querySelector(".close");

hamburger.addEventListener("click", () => {
    leftPanel.classList.add("open");
});

closeBtn.addEventListener("click", () => {
    leftPanel.classList.remove("open");
});