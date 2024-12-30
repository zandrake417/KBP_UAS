// Timer Logic
let timerInterval;
let isWorkTime = true;
let timeRemaining;
const timerDisplay = document.getElementById('timer');
const timerStatus = document.getElementById('timer-status');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const workDurationInput = document.getElementById('work-duration');
const breakDurationInput = document.getElementById('break-duration');

// Load alarm audio locally
const alarm = new Audio('alarm.wav');

function playAlarm() {
    alarm.play();
}

function notifyUser(message) {
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification(message);
    } else if ("Notification" in window && Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                new Notification(message);
            }
        });
    }
}

function startTimer() {
    const workDuration = parseInt(workDurationInput.value) * 60;
    const breakDuration = parseInt(breakDurationInput.value) * 60;
    timeRemaining = isWorkTime ? workDuration : breakDuration;

    timerStatus.textContent = isWorkTime ? 'Work Time' : 'Break Time';

    timerInterval = setInterval(() => {
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        timeRemaining--;
        if (timeRemaining < 0) {
            clearInterval(timerInterval);
            playAlarm();
            notifyUser(isWorkTime ? "Work session ended." : "Break session ended.");

            if (isWorkTime) {
                isWorkTime = false;
                startTimer();
            } else {
                timerDisplay.textContent = '00:00';
                timerStatus.textContent = 'Break Complete';
            }
        }
    }, 1000);
}

startBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    startTimer();
});

pauseBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
});

resetBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    timerDisplay.textContent = '25:00';
    timerStatus.textContent = 'Work Time';
    isWorkTime = true;
});

// YouTube Music Player Logic
let player;
let playlist = [];
let currentIndex = 0;
let loopPlaylist = false;
let isMusicPaused = false; // Track if the music is paused

function onYouTubeIframeAPIReady() {
    player = new YT.Player('youtube-player', {
        height: '0',
        width: '0',
        videoId: '',
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    console.log('YouTube Player Ready');
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        playNextInPlaylist();
    }
}

async function searchYouTube(query) {
    const apiKey = 'masukkanAPI'; // Replace with your YouTube API Key
    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&key=${apiKey}`);
    const data = await response.json();
    return {
        id: data.items[0].id.videoId,
        title: data.items[0].snippet.title,
        thumbnail: data.items[0].snippet.thumbnails.default.url
    };
}

function updateNowPlaying(song) {
    document.getElementById('current-song').textContent = song.title;
    const thumbnail = document.getElementById('thumbnail');
    thumbnail.src = song.thumbnail;
    thumbnail.style.display = 'block';
}

function updateDuration() {
    const currentTime = player.getCurrentTime();
    const totalTime = player.getDuration();
    document.getElementById('current-time').textContent = formatTime(currentTime);
    document.getElementById('total-duration').textContent = formatTime(totalTime);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
}

setInterval(() => {
    if (player && player.getPlayerState() === YT.PlayerState.PLAYING) {
        updateDuration();
    }
}, 1000);

function playNextInPlaylist() {
    if (currentIndex + 1 < playlist.length) {
        currentIndex++;
    } else if (loopPlaylist) {
        currentIndex = 0;
    } else {
        console.log('End of playlist');
        return;
    }

    const nextSong = playlist[currentIndex];
    player.loadVideoById(nextSong.id);
    updateNowPlaying(nextSong);
    player.playVideo();
}

function playSelectedSong(index) {
    currentIndex = index;
    const selectedSong = playlist[currentIndex];
    player.loadVideoById(selectedSong.id);
    updateNowPlaying(selectedSong);
    player.playVideo();
}

function deleteSongFromPlaylist(index) {
    playlist.splice(index, 1);
    savePlaylist(); // Simpan playlist setelah menghapus lagu
    renderPlaylist();
}

function renderPlaylist() {
    const playlistElement = document.getElementById('playlist');
    playlistElement.innerHTML = '';
    playlist.forEach((song, index) => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.textContent = song.title;

        const buttonsDiv = document.createElement('div');

        const playButton = document.createElement('button');
        playButton.className = 'btn btn-sm btn-success me-2';
        playButton.textContent = 'Play';
        playButton.addEventListener('click', () => playSelectedSong(index));

        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-sm btn-danger';
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => deleteSongFromPlaylist(index));

        buttonsDiv.appendChild(playButton);
        buttonsDiv.appendChild(deleteButton);
        li.appendChild(buttonsDiv);

        playlistElement.appendChild(li);
    });
}

// Fungsi untuk menyimpan playlist ke localStorage
function savePlaylist() {
    localStorage.setItem('playlist', JSON.stringify(playlist));
}

// Fungsi untuk memuat playlist dari localStorage
function loadPlaylist() {
    const storedPlaylist = JSON.parse(localStorage.getItem('playlist') || '[]');
    playlist = storedPlaylist;
    renderPlaylist();
}

// Event Listener untuk Tombol
document.getElementById('pause-music-btn').addEventListener('click', () => {
    if (player) {
        const playerState = player.getPlayerState();
        if (playerState === YT.PlayerState.PLAYING) {
            player.pauseVideo();
            isMusicPaused = true;
            document.getElementById('pause-music-btn').textContent = 'Resume Music';
        } else if (isMusicPaused) {
            player.playVideo();
            isMusicPaused = false;
            document.getElementById('pause-music-btn').textContent = 'Pause Music';
        }
    }
});

document.getElementById('skip-music-btn').addEventListener('click', () => {
    playNextInPlaylist();
});

document.getElementById('loop-playlist-btn').addEventListener('click', () => {
    loopPlaylist = !loopPlaylist;
    const button = document.getElementById('loop-playlist-btn');
    button.textContent = loopPlaylist ? 'Loop On' : 'Loop Off';
});

document.getElementById('add-to-playlist-btn').addEventListener('click', async () => {
    const query = document.getElementById('music-query').value;
    if (query) {
        const song = await searchYouTube(query);
        playlist.push(song);
        savePlaylist(); // Simpan playlist setelah menambahkan lagu
        renderPlaylist();
    }
});

document.getElementById('music-query').addEventListener('keydown', async (event) => {
    if (event.key === 'Enter') {
        const query = event.target.value.trim();
        if (query) {
            const song = await searchYouTube(query);
            playlist.push(song);
            savePlaylist(); // Simpan playlist setelah menambahkan lagu
            renderPlaylist();
            event.target.value = '';
        }
    }
});

async function addFromYouTubeLink(link) {
    try {
        const videoIdMatch = link.match(/(?:v=|\/videos\/|embed\/|youtu.be\/|\/v\/|vi\/|\/shorts\/|watch\/|&v=|%2Fvideos%2F|%2Fv%2F|vi%3D|%2Fembed%2F)([a-zA-Z0-9_-]{11})/);
        const playlistIdMatch = link.match(/(?:list=)([a-zA-Z0-9_-]+)/);

        if (videoIdMatch) {
            const videoId = videoIdMatch[1];
            const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=masukkanAPI`);
            const data = await response.json();
            if (data.items.length > 0) {
                const song = {
                    id: videoId,
                    title: data.items[0].snippet.title,
                    thumbnail: data.items[0].snippet.thumbnails.default.url,
                };
                playlist.push(song);
                savePlaylist(); // Simpan playlist setelah menambahkan lagu
                renderPlaylist();
            } else {
                alert("Invalid video link.");
            }
        } else if (playlistIdMatch) {
            const playlistId = playlistIdMatch[1];
            const response = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=20&playlistId=${playlistId}&key=MasukkanAPI`);
            const data = await response.json();
            if (data.items.length > 0) {
                data.items.forEach(item => {
                    const song = {
                        id: item.snippet.resourceId.videoId,
                        title: item.snippet.title,
                        thumbnail: item.snippet.thumbnails.default.url,
                    };
                    playlist.push(song);
                });
                savePlaylist(); // Simpan playlist setelah menambahkan lagu
                renderPlaylist();
            } else {
                alert("Invalid playlist link.");
            }
        } else {
            alert("Invalid link format. Please provide a valid YouTube video or playlist link.");
        }
    } catch (error) {
        console.error("Error adding from YouTube link:", error);
        alert("An error occurred while adding the link. Please try again.");
    }
}

document.getElementById('add-from-link-btn').addEventListener('click', async () => {
    const link = document.getElementById('youtube-link').value.trim();
    if (link) {
        await addFromYouTubeLink(link);
        document.getElementById('youtube-link').value = '';
    }
});

// Event listener untuk tombol Enter di input YouTube link
document.getElementById('youtube-link').addEventListener('keydown', async (event) => {
    if (event.key === 'Enter') { // Periksa apakah tombol yang ditekan adalah Enter
        const link = event.target.value.trim(); // Ambil nilai dari input
        if (link) {
            await addFromYouTubeLink(link); // Tambahkan dari YouTube link
            event.target.value = ''; // Kosongkan input setelah ditambahkan
        }
    }
});

function clearPlaylist() {
    playlist = [];
    savePlaylist(); // Hapus playlist dari localStorage
    renderPlaylist();
}

document.getElementById('clear-playlist-btn').addEventListener('click', () => {
    if (confirm("Are you sure you want to clear the playlist?")) {
        clearPlaylist();
    }
});

// Muat playlist dari localStorage saat halaman dimuat
loadPlaylist();

// To-Do List Logic
// Variabel Global
let todos = [];

// Elemen DOM
const todoList = document.getElementById('todo-list');
const todoInput = document.getElementById('todo-input');
const addTodoBtn = document.getElementById('add-todo-btn');
const todoCategory = document.getElementById('todo-category');

// Fungsi untuk Menyimpan ke LocalStorage
function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

// Fungsi untuk Memuat dari LocalStorage
function loadTodos() {
    const storedTodos = JSON.parse(localStorage.getItem('todos') || '[]');
    todos = storedTodos;
    renderTodos();
}

// Fungsi untuk Menandai Tugas Selesai
function toggleTodoCompletion(index) {
    const taskIndex = parseInt(index, 10); // Pastikan indeks berupa angka
    const task = todos[taskIndex];

    if (task.category === 'in-progress') {
        task.category = 'completed'; // Pindahkan ke Completed
        saveTodos(); // Simpan ke localStorage
        renderTodos(); // Render ulang
    }
}

// Fungsi untuk Menghapus Tugas
function deleteTodo(index) {
    const taskIndex = parseInt(index, 10); // Pastikan indeks berupa angka
    todos.splice(taskIndex, 1); // Hapus tugas dari array
    saveTodos(); // Simpan ke localStorage
    renderTodos(); // Render ulang
}

// Fungsi untuk Menambahkan Tugas Baru
function addTodo() {
    const text = todoInput.value.trim();
    if (text) {
        todos.push({ text, category: 'in-progress' }); // Tambahkan tugas baru
        saveTodos(); // Simpan ke localStorage
        renderTodos(); // Render ulang
        todoInput.value = ''; // Kosongkan input setelah ditambahkan
    }
}

// Fungsi untuk Merender Tugas
function renderTodos() {
    const selectedCategory = todoCategory.value; // Ambil kategori yang dipilih
    todoList.innerHTML = ''; // Bersihkan daftar tugas

    todos
        .filter((todo) => todo.category === selectedCategory) // Filter berdasarkan kategori
        .forEach((todo, index) => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = todo.category === 'completed';
            checkbox.disabled = todo.category === 'completed'; // Disabled jika Completed
            checkbox.setAttribute('data-index', index); // Simpan atribut data-index
            checkbox.addEventListener('change', (event) => {
                const taskIndex = event.target.getAttribute('data-index');
                toggleTodoCompletion(taskIndex); // Panggil fungsi dengan indeks yang benar
            });

            const text = document.createElement('span');
            text.textContent = todo.text;

            const deleteButton = document.createElement('button');
            deleteButton.className = 'btn btn-sm btn-danger';
            deleteButton.textContent = 'Delete';
            deleteButton.setAttribute('data-index', index); // Simpan atribut data-index
            deleteButton.addEventListener('click', (event) => {
                const taskIndex = event.target.getAttribute('data-index');
                deleteTodo(taskIndex); // Panggil fungsi dengan indeks yang benar
            });

            li.appendChild(checkbox);
            li.appendChild(text);
            li.appendChild(deleteButton);
            todoList.appendChild(li);
        });
}

// Event Listeners
addTodoBtn.addEventListener('click', addTodo);
todoCategory.addEventListener('change', renderTodos);

// Muat Tugas dari LocalStorage saat halaman dimuat
loadTodos();


// Statistik Waktu Belajar
let totalStudyTime = parseInt(localStorage.getItem('totalStudyTime')) || 0; // Dalam detik

function updateStudyStats() {
    const hours = Math.floor(totalStudyTime / 3600);
    const minutes = Math.floor((totalStudyTime % 3600) / 60);
    const seconds = totalStudyTime % 60;

    document.getElementById('study-stats').textContent = 
        `Total Study Time: ${hours}h ${minutes}m ${seconds}s`;
}

function saveStudyStats() {
    localStorage.setItem('totalStudyTime', totalStudyTime);
}

// Timer Logic
function startTimer() {
    const workDuration = parseInt(workDurationInput.value) * 60;
    const breakDuration = parseInt(breakDurationInput.value) * 60;
    timeRemaining = isWorkTime ? workDuration : breakDuration;

    timerStatus.textContent = isWorkTime ? 'Work Time' : 'Break Time';

    timerInterval = setInterval(() => {
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        // Perbarui statistik belajar real-time
        if (isWorkTime && timeRemaining > 0) {
            totalStudyTime++;
            updateStudyStats();
            saveStudyStats();
        }

        timeRemaining--;
        if (timeRemaining < 0) {
            clearInterval(timerInterval);
            playAlarm();
            notifyUser(isWorkTime ? "Work session ended." : "Break session ended.");

            if (isWorkTime) {
                isWorkTime = false;
                startTimer();
            } else {
                timerDisplay.textContent = '00:00';
                timerStatus.textContent = 'Break Complete';
            }
        }
    }, 1000);
}

// Muat statistik saat halaman dimuat
updateStudyStats();

