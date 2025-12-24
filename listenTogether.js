// ----------------- Globals -----------------
let currentSong = new Audio();
let currentIndex = 0;
let songs = [];
let currentFolder = "";
const leftPanel = document.querySelector(".left");
let listenTogetherActive = false;

// ----------------- Listen Together WebSocket -----------------
const ws = new WebSocket("ws://localhost:3000"); // Make sure your server is running

ws.onopen = () => {
    console.log("Connected to Listen Together server");
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    switch (data.type) {
        case "play":
            if (currentSong.paused) currentSong.play();
            playBtn.src = "pause.svg";
            break;
        case "pause":
            if (!currentSong.paused) currentSong.pause();
            playBtn.src = "play.svg";
            break;
        case "skip":
            if (songs[data.index]) playSong(data.index, true); // true = triggered remotely
            break;
        case "seek":
            currentSong.currentTime = data.time;
            break;
    }
};

// ----------------- Broadcast Function -----------------
function broadcast(action, payload = {}) {
    if (!listenTogetherActive) return;
    ws.send(JSON.stringify({ type: action, ...payload }));
}

// ----------------- Listen Together Toggle Button -----------------
let listenBtn = document.getElementById("listenTogetherBtn");
if (!listenBtn) {
    listenBtn = document.createElement("button");
    listenBtn.id = "listenTogetherBtn";
    listenBtn.innerText = "Listen Together";
    document.body.prepend(listenBtn);
}

listenBtn.addEventListener("click", () => {
    listenTogetherActive = !listenTogetherActive;
    listenBtn.classList.toggle("active");
    if (listenTogetherActive) {
        alert("Listen Together activated! Your actions will sync with others.");
    } else {
        alert("Listen Together deactivated.");
    }
});

// ----------------- Fetch Songs -----------------
async function getSongs(folder) {
    currentFolder = folder;
    let songUL = document.querySelector(".songsList ul");

    songUL.classList.add("fade-out");
    await new Promise(resolve => setTimeout(resolve, 400));

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

    showSongs();

    songUL.classList.remove("fade-out");
    songUL.classList.add("fade-in");
    setTimeout(() => songUL.classList.remove("fade-in"), 400);
}

// ----------------- Render Songs -----------------
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

        li.addEventListener("click", () => playSong(index));

        songUL.appendChild(li);

        setTimeout(() => li.classList.add("show"), index * 100);
    });
}

// ----------------- Play Song -----------------
function playSong(index, isRemote = false) {
    if (!isRemote) broadcast("skip", { index });

    if (!currentSong.paused) currentSong.pause();
    currentIndex = index;
    currentSong.src = songs[index].url;
    currentSong.play();

    document.querySelector("#play").src = "pause.svg";
    document.querySelector(".songinfo").innerText = songs[index].name;

    document.querySelector(".progress").style.width = "0%";
    document.querySelector(".circle").style.left = "0%";
}

// ----------------- Play / Pause -----------------
const playBtn = document.querySelector("#play");

playBtn.addEventListener("click", () => {
    if (currentSong.paused) {
        currentSong.play();
        playBtn.src = "pause.svg";
        if (listenTogetherActive) broadcast("play");
    } else {
        currentSong.pause();
        playBtn.src = "play.svg";
        if (listenTogetherActive) broadcast("pause");
    }
});

// ----------------- Previous / Next -----------------
document.querySelector("#previous").addEventListener("click", () => {
    if (currentIndex > 0) playSong(currentIndex - 1);
    if (listenTogetherActive) broadcast("skip", { index: currentIndex - 1 });
});

document.querySelector("#next").addEventListener("click", () => {
    if (currentIndex < songs.length - 1) playSong(currentIndex + 1);
    if (listenTogetherActive) broadcast("skip", { index: currentIndex + 1 });
});

// ----------------- Auto-play Next Song -----------------
currentSong.addEventListener("ended", () => {
    if (currentIndex < songs.length - 1) playSong(currentIndex + 1);
    if (listenTogetherActive) broadcast("skip", { index: currentIndex + 1 });
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
    let time = (e.offsetX / seekbar.offsetWidth) * currentSong.duration;
    currentSong.currentTime = time;
    if (listenTogetherActive) broadcast("seek", { time });
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

    circle.addEventListener("click", async (e) => {
        e.stopPropagation();
        let folder = `Songs/${card.dataset.folder}`;
        await getSongs(folder);

        if (songs.length > 0) playSong(0);

        if (window.innerWidth <= 768) leftPanel.classList.add("open");
    });

    card.addEventListener("click", async () => {
        let folder = `Songs/${card.dataset.folder}`;
        await getSongs(folder);

        if (window.innerWidth <= 768) leftPanel.classList.add("open");
    });
});

// ----------------- Hamburger Menu -----------------
const hamburger = document.querySelector(".hamburger");
const closeBtn = document.querySelector(".close");

hamburger.addEventListener("click", () => leftPanel.classList.add("open"));
closeBtn.addEventListener("click", () => leftPanel.classList.remove("open"));