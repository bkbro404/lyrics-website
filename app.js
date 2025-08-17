// App State
let currentSongs = [];
let allSongs = [];
let singers = {};
let aboutData = {};
let currentSongIndex = 0;
let showingChords = false;
let currentZoom = 1.1;
let currentTranspose = 0;
let currentView = 'songs';
let favoriteIds = [];
let previousView = null;
let currentSingerFilter = null;

// Chord progression for transposing
const chordProgression = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// DOM Elements
let searchInput, homeBtn, hamburgerMenu, menuDropdown, menuOverlay;
let homeMenu, singersMenu, favoritesMenu, requestMenu, aboutMenu;
let featuredSinger, singersGrid, songsSection, songsList;
let lyricsViewer, lyricsContent, lyricsText, videoSection;
let backBtn, prevSong, nextSong, zoomOut, zoomIn, toggleChords, transposeDown, transposeUp;
let requestModal, aboutModal, closeRequestModalBtn, closeAboutModalBtn;

// Initialize DOM elements
function initDOM() {
    searchInput = document.getElementById('searchInput');
    homeBtn = document.getElementById('homeBtn');
    hamburgerMenu = document.getElementById('hamburgerMenu');
    menuDropdown = document.getElementById('menuDropdown');
    menuOverlay = document.getElementById('menuOverlay');
    homeMenu = document.getElementById('homeMenu');
    singersMenu = document.getElementById('singersMenu');
    favoritesMenu = document.getElementById('favoritesMenu');
    requestMenu = document.getElementById('requestMenu');
    aboutMenu = document.getElementById('aboutMenu');
    featuredSinger = document.getElementById('featuredSinger');
    singersGrid = document.getElementById('singersGrid');
    songsSection = document.getElementById('songsSection');
    songsList = document.getElementById('songsList');
    lyricsViewer = document.getElementById('lyricsViewer');
    lyricsContent = document.getElementById('lyricsContent');
    lyricsText = document.getElementById('lyricsText');
    videoSection = document.getElementById('videoSection');
    backBtn = document.getElementById('backBtn');
    prevSong = document.getElementById('prevSong');
    nextSong = document.getElementById('nextSong');
    zoomOut = document.getElementById('zoomOut');
    zoomIn = document.getElementById('zoomIn');
    toggleChords = document.getElementById('toggleChords');
    transposeDown = document.getElementById('transposeDown');
    transposeUp = document.getElementById('transposeUp');
    requestModal = document.getElementById('requestModal');
    aboutModal = document.getElementById('aboutModal');
    closeRequestModalBtn = document.getElementById('closeRequestModal');
    closeAboutModalBtn = document.getElementById('closeAboutModal');
}

// Load data from JSON files
async function loadData() {
    try {
        // Load metadata (unchanged)
        const singerResponse = await fetch('singer.json');
        singers = await singerResponse.json();
        const aboutResponse = await fetch('about.json');
        aboutData = await aboutResponse.json();

        // Collect all songs from song files
        allSongs = [
            ...(window.yomas || []),
            ...(window.raj || []),
            ...(window.ramsing || []),
            ...(window.bhajan || []),
            ...(window.BalRam || []),
            ...(window.Bisram || []),
            ...(window.Chaitu || []),
            ...(window.Ghanshyam || []),
            ...(window.Haribans || []),
            ...(window.Mukesh || []),
            ...(window.JugRam || []),
            ...(window.Raghupati || []),
            ...(window.RamCharan || []),
            ...(window.Ramji || []),
            ...(window.Sani || []),
            ...(window.Unknown || []),
            ...(window.Chotilal || []),
            ...(window.TejBahadur || []),
            // Add more singers as needed
        ].filter(song => song); // Remove undefined

        currentSongs = [...allSongs];

        console.log('Data loaded:', {
            songs: allSongs.length,
            singers: Object.keys(singers.singers).length
        });

    } catch (error) {
        console.error('Error:', error);
        // Fallback data (unchanged)
        singers = { singers: {} };
        aboutData = {
            description: "Tharu Christian Bhajan App",
            version: "1.0.0"
        };
        allSongs = [];
    }
}
// Initialize App
async function init() {
    initDOM();
    await loadData();
    renderSongs();
    renderFeaturedSinger();
    attachEventListeners();
    updateHomeButtonText();
    loadAboutContent();
}

function loadAboutContent() {
    const aboutContent = document.getElementById('aboutContent');
    if (aboutData && aboutContent) {
        aboutContent.innerHTML = `
            <p>${aboutData.description}</p>
            
            <h4>Features:</h4>
            <ul>
                ${aboutData.features ? aboutData.features.map(feature => `<li>${feature}</li>`).join('') : ''}
            </ul>

            <h4>Usage:</h4>
            <ul>
                ${aboutData.usage ? aboutData.usage.map(usage => `<li>${usage}</li>`).join('') : ''}
            </ul>

            <h4>Contact:</h4>
            <p>${aboutData.contact || 'chaudharybibek806@gmail.com'}</p>

            <div class="app-version">
                ${aboutData.version || 'Version 1.0.0'} | Offline Ready
            </div>
        `;
    }
}

function attachEventListeners() {
    searchInput.addEventListener('input', handleSearch);
    homeBtn.addEventListener('click', goHome);

    // Menu events
    hamburgerMenu.addEventListener('click', toggleMenu);
    menuOverlay.addEventListener('click', closeMenu);
    homeMenu.addEventListener('click', () => {
        closeMenu();
        goHome();
    });
    singersMenu.addEventListener('click', () => {
        closeMenu();
        showSingersView();
    });
    favoritesMenu.addEventListener('click', () => {
        closeMenu();
        showFavoritesView();
    });
    requestMenu.addEventListener('click', () => {
        closeMenu();
        openRequestModal();
    });
    aboutMenu.addEventListener('click', () => {
        closeMenu();
        openAboutModal();
    });

    // Modal events
    closeRequestModalBtn.addEventListener('click', closeRequestModal);
    closeAboutModalBtn.addEventListener('click', closeAboutModal);

    // Lyrics viewer events
    backBtn.addEventListener('click', closeLyricsViewer);
    prevSong.addEventListener('click', () => navigateSong(-1));
    nextSong.addEventListener('click', () => navigateSong(1));
    zoomOut.addEventListener('click', () => adjustZoom(-0.1));
    zoomIn.addEventListener('click', () => adjustZoom(0.1));
    toggleChords.addEventListener('click', toggleChordsView);
    transposeDown.addEventListener('click', () => transpose(-1));
    transposeUp.addEventListener('click', () => transpose(1));

    // Close modals when clicking outside
    requestModal.addEventListener('click', (e) => {
        if (e.target === requestModal) closeRequestModal();
    });
    aboutModal.addEventListener('click', (e) => {
        if (e.target === aboutModal) closeAboutModal();
    });

    // Close menu when clicking elsewhere
    document.addEventListener('click', (e) => {
        if (!hamburgerMenu.contains(e.target) && !menuDropdown.contains(e.target)) {
            closeMenu();
        }
    });
}

function getSingers() {
    const singersData = {};
    allSongs.forEach(song => {
        if (!singersData[song.singer]) {
            singersData[song.singer] = [];
        }
        singersData[song.singer].push(song);
    });
    return singersData;
}

function renderFeaturedSinger() {
    const singersData = getSingers();
    const featuredSingerData = Object.entries(singersData).find(([name, songs]) => songs.length >= 10);

    if (featuredSingerData) {
        const [singerName, singerSongs] = featuredSingerData;
        const singerImage = singers.singers[singerName]?.image || singers.singers["David Chaudhary"]?.image;
        document.getElementById('featuredSingerImg').src = singerImage;
        document.getElementById('featuredSingerName').textContent = singerName;
        featuredSinger.classList.remove('hidden');
    } else {
        featuredSinger.classList.add('hidden');
    }
}

function renderSongs(songsToRender = allSongs) {
    currentSongs = [...songsToRender].sort((a, b) => a.title.localeCompare(b.title));
    songsList.innerHTML = '';

    currentSongs.forEach((song, index) => {
        const songElement = document.createElement('div');
        songElement.className = 'song-item fade-in';
        const isFavorited = favoriteIds.includes(song.id);

        songElement.innerHTML = `
            <div class="song-info">
                <div class="song-title">${song.title}</div>
                <div class="song-singer"> ${song.singer}</div>
            </div>
            <button class="favorite-btn ${isFavorited ? 'favorited' : ''}" data-song-id="${song.id}">
                ${isFavorited ? '❤️' : '🤍'}
            </button>
        `;

        songElement.querySelector('.song-info').addEventListener('click', () => openLyricsViewer(index));
        songElement.querySelector('.favorite-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(song.id);
        });

        songsList.appendChild(songElement);
    });
}

function renderSingers() {
    const singersData = getSingers();
    const singersArray = Object.entries(singersData);

    singersGrid.innerHTML = '<h2 class="section-title">All Singers</h2>';

    singersArray.forEach(([singerName, singerSongs]) => {
        const singerElement = document.createElement('div');
        singerElement.className = 'singer-card fade-in';
        const singerImage = singers.singers[singerName]?.image || singers.singers["David Chaudhary"]?.image;

        singerElement.innerHTML = `
            <img src="${singerImage}" alt="${singerName}">
            <div style="font-weight: bold; margin-bottom: 0.3rem;">${singerName}</div>
            <div style="color: #aaa; font-size: 0.8rem;">${singerSongs.length} songs</div>
        `;
        singerElement.addEventListener('click', () => showSingerSongs(singerName));
        singersGrid.appendChild(singerElement);
    });
}

function toggleMenu() {
    const isActive = menuDropdown.classList.contains('active');
    if (isActive) {
        closeMenu();
    } else {
        openMenu();
    }
}

function openMenu() {
    menuDropdown.classList.add('active');
    menuOverlay.classList.add('active');
}

function closeMenu() {
    menuDropdown.classList.remove('active');
    menuOverlay.classList.remove('active');
}

function goHome() {
    previousView = currentView;
    currentView = 'songs';
    currentSingerFilter = null;
    singersGrid.classList.add('hidden');
    songsSection.classList.remove('hidden');
    document.querySelector('#songsSection .section-title').textContent = 'All Songs (A-Z)';
    searchInput.value = '';
    renderSongs();
    updateHomeButtonText();
}

function showSingersView() {
    previousView = currentView;
    currentView = 'singers';
    currentSingerFilter = null;
    songsSection.classList.add('hidden');
    singersGrid.classList.remove('hidden');
    renderSingers();
    updateHomeButtonText();
}

function showFavoritesView() {
    previousView = currentView;
    currentView = 'favorites';
    currentSingerFilter = null;
    singersGrid.classList.add('hidden');
    songsSection.classList.remove('hidden');

    const favoriteSongs = allSongs.filter(song => favoriteIds.includes(song.id));
    document.querySelector('#songsSection .section-title').textContent = `❤️ Favorite Songs (${favoriteSongs.length})`;
    renderSongs(favoriteSongs);
    updateHomeButtonText();
}

function updateHomeButtonText() {
    if (currentView === 'songs' && !currentSingerFilter) {
        homeBtn.innerHTML = '🏠 Home';
    } else {
        homeBtn.innerHTML = '⬅ Back';
    }
}

function toggleFavorite(songId) {
    const index = favoriteIds.indexOf(songId);
    if (index === -1) {
        favoriteIds.push(songId);
    } else {
        favoriteIds.splice(index, 1);
    }

    if (currentView === 'favorites') {
        const favoriteSongs = allSongs.filter(song => favoriteIds.includes(song.id));
        document.querySelector('#songsSection .section-title').textContent = `❤️ Favorite Songs (${favoriteSongs.length})`;
        renderSongs(favoriteSongs);
    } else if (currentSingerFilter) {
        const singerSongs = allSongs.filter(song => song.singer === currentSingerFilter);
        renderSongs(singerSongs);
    } else {
        renderSongs(allSongs);
    }
}

function openRequestModal() {
    requestModal.style.display = 'flex';
}

function closeRequestModal() {
    requestModal.style.display = 'none';
}

function openAboutModal() {
    aboutModal.style.display = 'flex';
}

function closeAboutModal() {
    aboutModal.style.display = 'none';
}

function showSingerSongs(singerName) {
    const singerSongs = allSongs.filter(song => song.singer === singerName);
    previousView = currentView;
    currentView = 'songs';
    currentSingerFilter = singerName;
    singersGrid.classList.add('hidden');
    songsSection.classList.remove('hidden');

    document.querySelector('#songsSection .section-title').textContent = `Songs by ${singerName}`;
    renderSongs(singerSongs);
    updateHomeButtonText();
}

function handleSearch() {
    const query = searchInput.value.toLowerCase().trim();

    if (query === '') {
        if (currentView === 'songs' && !currentSingerFilter) {
            document.querySelector('#songsSection .section-title').textContent = 'All Songs (A-Z)';
            renderSongs();
        } else if (currentView === 'songs' && currentSingerFilter) {
            document.querySelector('#songsSection .section-title').textContent = `Songs by ${currentSingerFilter}`;
            const singerSongs = allSongs.filter(song => song.singer === currentSingerFilter);
            renderSongs(singerSongs);
        } else if (currentView === 'favorites') {
            const favoriteSongs = allSongs.filter(song => favoriteIds.includes(song.id));
            document.querySelector('#songsSection .section-title').textContent = `❤️ Favorite Songs (${favoriteSongs.length})`;
            renderSongs(favoriteSongs);
        }
        return;
    }

    let songsToFilter = allSongs;
    if (currentView === 'favorites') {
        songsToFilter = allSongs.filter(song => favoriteIds.includes(song.id));
    } else if (currentSingerFilter) {
        songsToFilter = allSongs.filter(song => song.singer === currentSingerFilter);
    }

    const filteredSongs = songsToFilter.filter(song =>
        song.title.toLowerCase().includes(query) ||
        song.singer.toLowerCase().includes(query)
    );

    if (currentView === 'singers') {
        previousView = currentView;
        currentView = 'songs';
        singersGrid.classList.add('hidden');
        songsSection.classList.remove('hidden');
        updateHomeButtonText();
    }

    let contextText = '';
    if (currentView === 'favorites') {
        contextText = ' in Favorites';
    } else if (currentSingerFilter) {
        contextText = ` ${currentSingerFilter}`;
    }

    document.querySelector('#songsSection .section-title').textContent = `Search Results for "${query}"${contextText}`;
    renderSongs(filteredSongs);
}

function openLyricsViewer(songIndex) {
    currentSongIndex = songIndex;
    currentTranspose = 0;
    showingChords = false;
    currentZoom = 1.1;

    toggleChords.textContent = 'Show Chords';
    toggleChords.classList.remove('active');

    lyricsViewer.style.display = 'flex';
    renderLyrics();
}

function closeLyricsViewer() {
    lyricsViewer.style.display = 'none';
}

function renderLyrics() {
    const song = currentSongs[currentSongIndex];
    if (!song) return;

    let content = showingChords && song.hasChords ? song.chords : song.lyrics;

    if (showingChords && currentTranspose !== 0) {
        content = transposeChords(content, currentTranspose);
    }

    lyricsText.innerHTML = `
        <h2 style="color: #5D5CDE; text-align: center; margin-bottom: 1rem;">${song.title}</h2>
        <h3 style="color: #aaa; text-align: center; margin-bottom: 2rem;"> ${song.singer}</h3>
        <div style="font-size: ${currentZoom}rem;">${formatLyrics(content)}</div>
    `;

    renderVideoSection(song);
}

function renderVideoSection(song) {
    if (song.youtubeLink && song.youtubeLink.trim() !== '') {
        const videoId = extractYouTubeId(song.youtubeLink);
        if (videoId) {
            videoSection.innerHTML = `
                <h4>🎬 Watch Lyrics Video</h4>
                <div class="video-container">
                    <iframe src="https://www.youtube.com/embed/${videoId}" 
                            allowfullscreen 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
                    </iframe>
                </div>
            `;
        } else {
            videoSection.innerHTML = `
                <h4>🎬 Watch Lyrics Video</h4>
                <div class="no-video">
                    <a href="${song.youtubeLink}" target="_blank" style="color: #5D5CDE; text-decoration: none;">
                        🔗 Open YouTube Link
                    </a>
                </div>
            `;
        }
    } else {
        videoSection.innerHTML = `
            <h4>🎬 Lyrics Video</h4>
            <div class="no-video">
                No video available for this song
            </div>
        `;
    }
}

function extractYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function formatLyrics(lyrics) {
    if (showingChords) {
        return lyrics.replace(/\[([^\]]+)\]/g, '<span class="chord">$1</span>');
    }
    return lyrics;
}

function transposeChords(lyrics, steps) {
    return lyrics.replace(/\[([^\]]+)\]/g, (match, chordGroup) => {
        const transposedChords = chordGroup.split(/(\s+)/).map(chord => {
            if (chord.trim() === '') return chord;
            return transposeChord(chord, steps);
        }).join('');
        return `[${transposedChords}]`;
    });
}

function transposeChord(chord, steps) {
    const chordMatch = chord.match(/^([A-G][#b]?)(.*)$/);
    if (!chordMatch) return chord;

    const [, root, suffix] = chordMatch;
    const currentIndex = chordProgression.indexOf(root.replace('b', '#'));

    if (currentIndex === -1) return chord;

    const newIndex = (currentIndex + steps + chordProgression.length) % chordProgression.length;
    return chordProgression[newIndex] + suffix;
}

function navigateSong(direction) {
    const newIndex = currentSongIndex + direction;
    if (newIndex >= 0 && newIndex < currentSongs.length) {
        currentSongIndex = newIndex;
        currentTranspose = 0;
        renderLyrics();
    }
}

function adjustZoom(amount) {
    currentZoom = Math.max(0.8, Math.min(2.0, currentZoom + amount));
    renderLyrics();
}

function toggleChordsView() {
    const song = currentSongs[currentSongIndex];
    if (!song.hasChords) return;

    showingChords = !showingChords;
    toggleChords.textContent = showingChords ? 'Hide Chords' : 'Show Chords';
    toggleChords.classList.toggle('active', showingChords);
    renderLyrics();
}

function transpose(direction) {
    if (!showingChords) return;

    currentTranspose += direction;
    currentTranspose = Math.max(-6, Math.min(6, currentTranspose));
    renderLyrics();
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
