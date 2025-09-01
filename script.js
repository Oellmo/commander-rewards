document.addEventListener('DOMContentLoaded', () => {
    // Navigations-Logik für die Single Page Application
    const pages = document.querySelectorAll('.page');
    const headerTitle = document.getElementById('header-title');
    const footerLinks = document.querySelectorAll('footer a');

    function navigate(pageId) {
        pages.forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById(`${pageId}-page`).classList.add('active');

        let title = '';
        switch (pageId) {
            case 'activity':
                title = 'Activity';
                break;
            case 'dashboard':
                title = 'Dashboard';
                break;
            case 'reward':
                title = 'Your Reward';
                break;
            case 'collection':
                title = 'Collection';
                break;
            case 'reward-settings':
                title = 'Reward Settings';
                break;
        }
        headerTitle.textContent = title;

        footerLinks.forEach(link => {
            link.classList.remove('text-[var(--primary-color)]');
            link.classList.add('text-[var(--text-secondary)]');
        });

        const activeLink = document.querySelector(`footer a[onclick="navigate('${pageId}')"]`);
        if (activeLink) {
            activeLink.classList.remove('text-[var(--text-secondary)]');
            activeLink.classList.add('text-[var(--primary-color)]');
        }

        if (pageId === 'dashboard') {
            renderCalendar();
        } else if (pageId === 'collection') {
            renderCollection();
        } else if (pageId === 'reward') {
            initRewardPage();
        } else if (pageId === 'reward-settings') {
            renderRewardDeck();
        } else if (pageId === 'activity') {
            renderPreviousWorkouts();
        }
    }

    window.navigate = navigate;

    // Workout Tracking Logik (von 1_activity.html)
    const startWorkoutButton = document.getElementById('start-workout-button');
    const endWorkoutButton = document.getElementById('end-workout-button');
    const workoutTimer = document.getElementById('workout-timer');
    const previousWorkoutsList = document.getElementById('previous-workouts-list');

    let timerInterval;
    let startTime;
    let currentWorkout = null;

    if (startWorkoutButton) {
        startWorkoutButton.addEventListener('click', () => {
            startTime = Date.now();
            currentWorkout = {
                // Verwende den vollständigen ISO-String als eindeutige ID
                id: new Date().toISOString(),
                date: new Date().toISOString().split('T')[0],
                duration: 0
            };
            timerInterval = setInterval(updateTimer, 1000);
            startWorkoutButton.classList.add('hidden');
            endWorkoutButton.classList.remove('hidden');
        });
    }

    if (endWorkoutButton) {
        endWorkoutButton.addEventListener('click', () => {
            clearInterval(timerInterval);
            if (currentWorkout) {
                const totalDuration = Date.now() - startTime;
                currentWorkout.duration = totalDuration;
                saveWorkout(currentWorkout);
                currentWorkout = null;
                updateStats();
                checkRewardEligibility();
                // Automatische Navigation zur Belohnungsseite nach dem Workout
                navigate('reward');
            }
            workoutTimer.textContent = '00:00:00';
            endWorkoutButton.classList.add('hidden');
            startWorkoutButton.classList.remove('hidden');
        });
    }

    function updateTimer() {
        const elapsedTime = Date.now() - startTime;
        const totalSeconds = Math.floor(elapsedTime / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        workoutTimer.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }

    function pad(number) {
        return number < 10 ? '0' + number : number;
    }

    function saveWorkout(workout) {
        const workouts = JSON.parse(localStorage.getItem('workouts')) || [];
        workouts.push(workout);
        localStorage.setItem('workouts', JSON.stringify(workouts));
        renderPreviousWorkouts();
    }

    function renderPreviousWorkouts() {
        const workouts = JSON.parse(localStorage.getItem('workouts')) || [];
        if (previousWorkoutsList) {
            previousWorkoutsList.innerHTML = '';
            // Umgekehrte Reihenfolge, um die neuesten Workouts oben anzuzeigen
            const sortedWorkouts = workouts.slice().reverse();
            sortedWorkouts.forEach(workout => {
                const durationInSeconds = Math.floor(workout.duration / 1000);
                const hours = Math.floor(durationInSeconds / 3600);
                const minutes = Math.floor((durationInSeconds % 3600) / 60);
                const seconds = durationInSeconds % 60;
                const workoutElement = document.createElement('div');
                workoutElement.classList.add('p-4', 'rounded-xl', 'bg-[var(--secondary-color)]', 'flex', 'items-center', 'justify-between');
                workoutElement.innerHTML = `
                    <div>
                        <p class="font-semibold">${new Date(workout.date).toLocaleDateString()}</p>
                        <p class="text-sm text-[var(--text-secondary)]">Duration: ${pad(hours)}:${pad(minutes)}:${pad(seconds)}</p>
                    </div>
                    <button onclick="deleteWorkout('${workout.id}')">
                        <span class="material-symbols-outlined text-red-500 text-sm">close</span>
                    </button>
                `;
                previousWorkoutsList.appendChild(workoutElement);
            });
        }
    }
    window.renderPreviousWorkouts = renderPreviousWorkouts; // Global verfügbar machen

    // Verwende die eindeutige ID zum Löschen
    function deleteWorkout(workoutId) {
        // Bestätigungsdialog hinzufügen
        const confirmDelete = window.confirm("Are you sure you want to delete this workout?");
        if (confirmDelete) {
            let workouts = JSON.parse(localStorage.getItem('workouts')) || [];
            workouts = workouts.filter(workout => workout.id !== workoutId);
            localStorage.setItem('workouts', JSON.stringify(workouts));
            renderPreviousWorkouts();
            updateStats();
            renderCalendar();
            checkRewardEligibility();
        }
    }
    window.deleteWorkout = deleteWorkout;

    // Dashboard Logik (von 2_dashboard.html)
    const cardsCollectedStat = document.getElementById('cards-collected-stat');
    const workoutsCompletedStat = document.getElementById('workouts-completed-stat');

    function updateStats() {
        const collection = JSON.parse(localStorage.getItem('collection')) || [];
        const workouts = JSON.parse(localStorage.getItem('workouts')) || [];
        const rewardDeck = JSON.parse(localStorage.getItem('rewardDeck')) || [];

        if (cardsCollectedStat) {
            cardsCollectedStat.textContent = `${collection.length} / ${collection.length + rewardDeck.length}`;
        }
        if (workoutsCompletedStat) {
            workoutsCompletedStat.textContent = workouts.length;
        }
    }

    function renderCalendar() {
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl) return;
        calendarEl.innerHTML = `
            <h2 class="font-bold text-lg mb-4">Workout Calendar</h2>
            <div class="grid grid-cols-7 gap-1 text-center">
                <div class="text-sm font-semibold text-[var(--primary-color)]">Mo</div>
                <div class="text-sm font-semibold text-[var(--primary-color)]">Di</div>
                <div class="text-sm font-semibold text-[var(--primary-color)]">Mi</div>
                <div class="text-sm font-semibold text-[var(--primary-color)]">Do</div>
                <div class="text-sm font-semibold text-[var(--primary-color)]">Fr</div>
                <div class="text-sm font-semibold text-[var(--primary-color)]">Sa</div>
                <div class="text-sm font-semibold text-[var(--primary-color)]">So</div>
            </div>
            <div id="calendar-days" class="grid grid-cols-7 gap-1 text-center mt-2"></div>
        `;

        const calendarDaysEl = document.getElementById('calendar-days');
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
        for (let i = 0; i < startDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            calendarDaysEl.appendChild(emptyDay);
        }

        const workouts = JSON.parse(localStorage.getItem('workouts')) || [];
        const workoutDates = new Set(workouts.map(w => w.date));

        for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('w-8', 'h-8', 'rounded-full', 'flex', 'items-center', 'justify-center', 'font-medium', 'text-sm');
            dayElement.textContent = day;

            const dateStr = new Date(today.getFullYear(), today.getMonth(), day).toISOString().split('T')[0];
            if (workoutDates.has(dateStr)) {
                dayElement.classList.add('bg-[var(--primary-color)]', 'text-white');
            } else if (day === today.getDate()) {
                dayElement.classList.add('bg-[var(--accent-color)]');
            }

            calendarDaysEl.appendChild(dayElement);
        }
    }

    // Belohnungs-Logik (mit Drehfunktion)
    const rewardCardFlipper = document.getElementById('reward-card-flipper');
    const rewardCardFront = document.getElementById('reward-card-front');
    const rewardCardBack = document.getElementById('reward-card-back');
    const rewardCardImage = document.getElementById('reward-card-image'); // Das Bild auf der Rückseite
    const claimRewardButton = document.getElementById('claim-reward-button');
    const rewardStatusMessage = document.getElementById('reward-status-message');

    let isCardFlipped = false; // Zustand, um zu verfolgen, ob die Karte gedreht ist

    function checkRewardEligibility() {
        const workouts = JSON.parse(localStorage.getItem('workouts')) || [];
        const collectedCards = JSON.parse(localStorage.getItem('collection')) || [];
        const deck = JSON.parse(localStorage.getItem('rewardDeck')) || [];
        
        const rewardConditionsMet = workouts.length > collectedCards.length;

        if (rewardConditionsMet && deck.length > 0) {
            if (claimRewardButton) {
                claimRewardButton.classList.remove('hidden');
                rewardStatusMessage.textContent = 'You have earned a reward! Tap to reveal.';
            }
        } else {
            if (claimRewardButton) {
                claimRewardButton.classList.add('hidden');
                if (deck.length === 0) {
                    rewardStatusMessage.textContent = 'Your reward deck is empty. Please add cards on the Settings page.';
                } else if (!rewardConditionsMet) {
                    rewardStatusMessage.textContent = 'Complete another workout to earn a reward.';
                }
            }
        }
    }

    if (claimRewardButton) {
        // Der "Claim Reward" Button wird jetzt die Karte umdrehen
        claimRewardButton.addEventListener('click', () => {
            if (!isCardFlipped) { // Nur umdrehen, wenn nicht bereits umgedreht
                flipCardAndClaimReward();
            } else {
                // Wenn die Karte bereits gedreht ist, könnte der Button eine andere Aktion auslösen
                // Zum Beispiel, direkt eine neue Belohnung beanspruchen, wenn eine verfügbar ist
                // Oder einfach nichts tun, wenn keine neue Belohnung verfügbar ist
                checkRewardEligibility(); // Aktualisiert den Status, falls sich die Bedingungen geändert haben
            }
        });
    }

    // Event-Listener für das Klicken auf die Karte selbst
    if (rewardCardFlipper) {
        rewardCardFlipper.addEventListener('click', () => {
            if (!isCardFlipped) {
                flipCardAndClaimReward();
            }
        });
    }

    async function flipCardAndClaimReward() {
        const rewardDeck = JSON.parse(localStorage.getItem('rewardDeck')) || [];
        if (rewardDeck.length === 0) {
            alert('Your reward deck is empty. Please add cards in the Settings.');
            return;
        }

        const workouts = JSON.parse(localStorage.getItem('workouts')) || [];
        const collectedCards = JSON.parse(localStorage.getItem('collection')) || [];
        if (!(workouts.length > collectedCards.length)) {
            alert('Complete another workout to earn a reward before revealing.');
            return;
        }

        // Karte drehen
        if (rewardCardFlipper) {
            rewardCardFlipper.style.transform = 'rotateY(180deg)';
            isCardFlipped = true;
        }

        // Belohnung beanspruchen nach kurzer Verzögerung
        setTimeout(async () => {
            await claimRewardLogic(); // Die eigentliche Logik zum Beanspruchen der Belohnung
        }, 350); // Halbe Dauer der Dreh-Animation

        // Nach einer weiteren Verzögerung die Karte wieder auf die Vorderseite drehen
        setTimeout(() => {
            if (rewardCardFlipper) {
                rewardCardFlipper.style.transform = 'rotateY(0deg)';
                isCardFlipped = false;
            }
            initRewardPage(); // Setzt die Reward-Seite zurück
        }, 300000); // Zeigt die aufgedeckte Karte für 5 Minuten an
    }

    async function claimRewardLogic() {
        const rewardDeck = JSON.parse(localStorage.getItem('rewardDeck')) || [];
        
        const randomIndex = Math.floor(Math.random() * rewardDeck.length);
        const claimedCard = rewardDeck[randomIndex];
        
        // Füge die Karte zur Sammlung hinzu
        const collection = JSON.parse(localStorage.getItem('collection')) || [];
        collection.push(claimedCard);
        localStorage.setItem('collection', JSON.stringify(collection));

        // Entferne die Karte aus dem Deck
        rewardDeck.splice(randomIndex, 1);
        localStorage.setItem('rewardDeck', JSON.stringify(rewardDeck));

        // Update the UI with the claimed card image
        if (rewardCardImage && claimedCard.image_uris && claimedCard.image_uris.normal) {
            rewardCardImage.src = claimedCard.image_uris.normal;
            rewardCardImage.alt = claimedCard.name;
        } else if (rewardCardImage) {
            rewardCardImage.src = 'https://via.placeholder.com/300x420?text=Card+Error';
            rewardCardImage.alt = 'Error loading card image';
        }
        
        updateStats();
        // checkRewardEligibility wird in initRewardPage aufgerufen
    }
    
    // Initialisierung der Belohnungsseite
    function initRewardPage() {
        if (rewardCardFlipper) {
            rewardCardFlipper.style.transform = 'rotateY(0deg)'; // Stellt sicher, dass die Karte auf der Vorderseite ist
            isCardFlipped = false;
        }
        if (rewardCardImage) {
            rewardCardImage.src = 'https://via.placeholder.com/300x420?text=Claim+Your+Reward'; // Setzt das Bild zurück
            rewardCardImage.alt = 'Reward Card Placeholder';
        }
        checkRewardEligibility(); // Aktualisiert den Belohnungsstatus
    }
    
    // Sammlung Logik (von 4_collection.html)
    const collectionGrid = document.getElementById('collection-grid');
    const rarityFilter = document.getElementById('rarity-filter');
    if (rarityFilter) {
        rarityFilter.addEventListener('change', (event) => {
            renderCollection(event.target.value);
        });
    }

    async function renderCollection(filter = 'All') {
        const collections = JSON.parse(localStorage.getItem('collection')) || [];
        if (!collectionGrid) return;
        collectionGrid.innerHTML = '';
        const filteredCards = collections.filter(card => filter === 'All' || card.rarity === filter);

        if (filteredCards.length > 0) {
            for (const card of filteredCards) {
                const cardElement = document.createElement('div');
                cardElement.classList.add('w-full', 'cursor-pointer', 'duration-300'); // Nur noch 'duration-300' für ggf. andere Animationen
                const imgURL = card.image_uris.normal;
                cardElement.innerHTML = `<img alt="${card.name}" class="w-full rounded-lg shadow-md aspect-[672/936] object-cover" src="${imgURL}"/>`;

                // Event-Listener für das Öffnen des Vollbildmodus
                cardElement.addEventListener('click', () => {
                    const fullscreenOverlay = document.getElementById('fullscreen-overlay');
                    const fullscreenImage = document.getElementById('fullscreen-image');
                    if (fullscreenImage && fullscreenOverlay) {
                        fullscreenImage.src = imgURL;
                        fullscreenOverlay.classList.remove('hidden');
                    }
                });

                collectionGrid.appendChild(cardElement);
            }
        } else {
            collectionGrid.innerHTML = `<p class="text-center w-full text-[var(--text-secondary)]">No cards found in your collection.</p>`;
        }
    }

    // Logik für die "Reward Settings" Seite
    const rewardInput = document.getElementById('reward-input');
    const addRewardCardButton = document.getElementById('add-reward-card-button');
    const bulkRewardInput = document.getElementById('bulk-reward-input');
    const addBulkCardsButton = document.getElementById('add-bulk-cards-button');

    if (addRewardCardButton) {
        addRewardCardButton.addEventListener('click', () => {
            const cardName = rewardInput.value.trim();
            if (cardName) {
                addCardToRewardDeck(cardName);
                rewardInput.value = '';
            }
        });
    }

    if (addBulkCardsButton) {
        addBulkCardsButton.addEventListener('click', async () => {
            const cardNamesText = bulkRewardInput.value.trim();
            if (cardNamesText) {
                const cardNames = cardNamesText.split('\n').map(name => {
                    // Diese Zeile entfernt die führende Nummer und das Leerzeichen.
                    const cleanedName = name.trim().replace(/^\d+\s/, '');
                    return cleanedName;
                }).filter(name => name !== '');
                
                // Hier wurde der Code geändert, um await zu verwenden
                for (const name of cardNames) {
                    await addCardToRewardDeck(name);
                }
                
                bulkRewardInput.value = '';
            }
        });
    }

    async function addCardToRewardDeck(cardName) {
        const rewardDeck = JSON.parse(localStorage.getItem('rewardDeck')) || [];
        
        const cardExists = rewardDeck.some(card => card.name.toLowerCase() === cardName.toLowerCase());
        if (cardExists) {
            alert(`Card "${cardName}" is already in your reward deck.`);
            return;
        }

        try {
            const cardInfo = await getScryfallData(cardName);
            if (cardInfo) {
                rewardDeck.push({
                    name: cardInfo.name,
                    rarity: cardInfo.rarity,
                    image_uris: cardInfo.image_uris
                });
                localStorage.setItem('rewardDeck', JSON.stringify(rewardDeck));
                renderRewardDeck();
            } else {
                alert(`Could not find card: ${cardName}`);
            }
        } catch (error) {
            console.error('Error adding card to reward deck:', error);
            alert(`Error adding card: ${cardName}`);
        }
    }

    async function renderRewardDeck() {
        const rewardDeck = JSON.parse(localStorage.getItem('rewardDeck')) || [];
        const rewardDeckList = document.getElementById('reward-deck-list');
        if (!rewardDeckList) return;
        rewardDeckList.innerHTML = '';
        
        if (rewardDeck.length > 0) {
            for (const card of rewardDeck) {
                const liElement = document.createElement('li');
                liElement.classList.add('p-4', 'rounded-xl', 'bg-[var(--secondary-color)]', 'flex', 'items-center', 'justify-between');
                
                const deleteButton = document.createElement('button');
                deleteButton.innerHTML = '<span class="material-symbols-outlined text-red-500 text-sm">close</span>';
                deleteButton.classList.add('p-1');
                deleteButton.onclick = (e) => {
                    e.stopPropagation();
                    deleteCardFromRewardDeck(card.name);
                };
                
                const cardDetails = document.createElement('div');
                cardDetails.classList.add('flex', 'items-center', 'gap-4');
                const imgURL = card.image_uris.small;
                cardDetails.innerHTML = `<img alt="${card.name}" class="w-12 h-12 rounded-md object-cover" src="${imgURL}"/>`;
                cardDetails.innerHTML += `<p class="font-semibold">${card.name}</p>`;

                liElement.appendChild(cardDetails);
                liElement.appendChild(deleteButton);
                
                rewardDeckList.appendChild(liElement);
            }
        } else {
            rewardDeckList.innerHTML = `<li class="text-center w-full text-[var(--text-secondary)]">No cards in your reward deck.</li>`;
        }
    }
    
    function deleteCardFromRewardDeck(cardName) {
        const confirmDelete = window.confirm(`Are you sure you want to delete the card "${cardName}"?`);
        if (confirmDelete) {
            let rewardDeck = JSON.parse(localStorage.getItem('rewardDeck')) || [];
            rewardDeck = rewardDeck.filter(card => card.name !== cardName);
            localStorage.setItem('rewardDeck', JSON.stringify(rewardDeck));
            renderRewardDeck();
        }
    }
    window.deleteCardFromRewardDeck = deleteCardFromRewardDeck;

    // Scryfall API Helper-Funktion
    async function getScryfallData(cardName) {
        try {
            const response = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`);
            if (response.status === 404) {
                return null;
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Failed to fetch card data:', error);
            return null;
        }
    }

    // Initialisiere die erste Seite (Dashboard)
    navigate('dashboard');
    renderPreviousWorkouts();
    updateStats();
    
    // Logik für das Schließen des Vollbild-Overlays
    const fullscreenOverlay = document.getElementById('fullscreen-overlay');
    const closeFullscreenOverlayButton = document.getElementById('close-fullscreen-overlay');

    if (closeFullscreenOverlayButton) {
        closeFullscreenOverlayButton.addEventListener('click', () => {
            fullscreenOverlay.classList.add('hidden'); // Overlay ausblenden
        });
    }

    if (fullscreenOverlay) {
        // Schließt das Overlay auch, wenn man daneben klickt
        fullscreenOverlay.addEventListener('click', (event) => {
            if (event.target === fullscreenOverlay) {
                fullscreenOverlay.classList.add('hidden');
            }
        });
    }
});

// Function zum Abrufen von Vorschlägen von der Scryfall API
async function fetchCardSuggestions(query) {
    if (query.length < 3) {
        return [];
    }
    const response = await fetch(`https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    return data.data; // Das 'data'-Array enthält die Kartennamen
}

// Event-Listener für die Autovervollständigung
document.getElementById('reward-input').addEventListener('input', async (event) => {
    const query = event.target.value;
    const suggestionsDatalist = document.getElementById('card-suggestions');
    suggestionsDatalist.innerHTML = '';
    
    if (query.length > 2) {
        const suggestions = await fetchCardSuggestions(query);
        suggestions.forEach(cardName => {
            const option = document.createElement('option');
            option.value = cardName;
            suggestionsDatalist.appendChild(option);
        });
    }
});
