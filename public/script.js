// Elements from the DOM
const nameInput = document.getElementById('name');
const drawBtn = document.getElementById('drawBtn');
const resultP = document.getElementById('result');
const gridElem = document.querySelector('.grid');
const finalReveal = document.getElementById('finalReveal');
const finalImg = document.getElementById('finalImg');
const finalName = document.getElementById('finalName');
const genderRadios = document.getElementsByName('gender');
const addCharBtn = document.getElementById('addCharBtn');
const modal = document.getElementById('modal');
const closeModalBtn = document.getElementById('closeModal');
const newNameInput = document.getElementById('newName');
const saveCharBtn = document.getElementById('saveCharBtn');

// List of characters by gender (for populating the grid)
const maleChars = [
    'Abel', 'Abraão', 'Corá', 'Daniel', 'Davi', 'Esaú', 'Ezequias',
    'Gideão', 'Isaías', 'Jacó', 'Jeremias', 'Jó', 'Jonas', 'Jonatã', 'José',
    'Josias', 'Josué', 'Ló', 'Manoá', 'Miriã', 'Moisés', 'Neemias', 'Noé',
    'Paulo', 'Pedro', 'Potifar', 'Raabe', 'Rubem', 'Rute',
    'Salomão', 'Samuel', 'Sansão', 'Timóteo', 'Zípora'
];

const femaleChars = [
    'Ana', 'Ester', 'Miriã', 'Noemi', 'Raabe', 'Rute', 'Zípora'
];


// Utility to normalize name to image filename (lowercase, remove accents, replace spaces)
function normalizeName(str) {
    return str.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // remove accents
        .replace(/[^a-z0-9]+/g, '_')  // replace non-alphanumeric with underscore
        .replace(/^_+|_+$/g, '');    // trim underscores from ends
}

// Populate the 5x5 grid with random character cards based on selected gender
function updateGrid(gender) {
    // Clear existing cards
    gridElem.innerHTML = '';
    // Choose source list based on gender
    const sourceList = (gender === 'M') ? maleChars : femaleChars;
    const total = 25;
    for (let i = 0; i < total; i++) {
        // Pick a random character from the list
        const charName = sourceList[Math.floor(Math.random() * sourceList.length)];
        const imgFile = normalizeName(charName) + '.jpg';
        // Create card element
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        const img = document.createElement('img');
        img.src = 'img/' + imgFile;
        img.alt = charName;
        cardDiv.appendChild(img);
        gridElem.appendChild(cardDiv);
    }
}

// Event listener for gender radio change to refresh the grid
genderRadios.forEach(radio => {
    radio.addEventListener('change', () => {
        const selectedGender = document.querySelector('input[name="gender"]:checked').value;
        updateGrid(selectedGender);
    });
});

// Draw button click: perform the draw and animations
drawBtn.onclick = function () {
    const userName = nameInput.value.trim();
    const userGender = document.querySelector('input[name="gender"]:checked').value;
    if (!userName) {
        alert('Por favor, insira seu nome');
        return;
    }
    // If a final result is currently displayed from a previous draw, reset UI for new draw
    if (finalReveal.style.display !== 'none') {
        // Hide final reveal
        finalReveal.style.display = 'none';
        finalImg.classList.remove('glowing');
        finalName.textContent = '';
        // Show grid again
        gridElem.style.display = 'grid';
        // Refresh grid images for current gender selection
        updateGrid(userGender);
    }
    // Disable inputs during draw
    nameInput.disabled = true;
    genderRadios.forEach(r => r.disabled = true);
    drawBtn.disabled = true;
    resultP.textContent = ''; // clear any previous message

    // Request the draw result from server
    fetch('/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: userName, gender: userGender })
    })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => { throw new Error(text || 'Erro ao sortear'); });
            }
            return response.json();
        })
        .then(data => {
            const charName = data.character;
            // Animate cards: glow and shuffle
            const cards = document.querySelectorAll('.card');
            if (cards.length === 0) {
                // If for some reason grid is empty, regenerate it
                updateGrid(userGender);
            }
            // Add glowing effect to all cards
            cards.forEach(card => card.classList.add('glowing'));
            // Create GSAP timeline for animations
            const tl = gsap.timeline();
            // Shuffle animation: flip cards back and forth and spin
            tl.to('.card', {
                duration: 0.3,
                rotationY: 180,
                ease: 'power1.inOut',
                yoyo: true,
                repeat: 5,
                stagger: 0.01
            });
            tl.to('.card', {
                duration: 1.5,
                rotationX: 360,
                ease: 'power1.inOut',
                stagger: 0.01
            });
            // After shuffling, fade out all cards
            tl.to('.card', {
                duration: 0.5,
                opacity: 0,
                ease: 'power1.in'
            });
            // When fade-out is complete, reveal the final card
            tl.add(() => {
                // Remove glow classes from all cards
                cards.forEach(card => card.classList.remove('glowing'));
                // Hide the grid container
                gridElem.style.display = 'none';
                // Set final card content (image and text)
                finalImg.src = 'img/' + normalizeName(charName) + '.jpg';
                finalImg.alt = charName;
                finalName.textContent = `Parabéns ${userName}! Você tirou ${charName}!`;
                // Show final reveal
                finalReveal.style.display = 'block';
                // Add glow to final image and animate the card appearance
                finalImg.classList.add('glowing');
                gsap.from('.final-card', {
                    duration: 1,
                    scale: 0,
                    rotation: 360,
                    ease: 'back.out(1.7)'
                });
            });
            // Re-enable inputs after animation (allow another draw for a different name)
            tl.add(() => {
                nameInput.disabled = false;
                genderRadios.forEach(r => r.disabled = false);
                drawBtn.disabled = false;
            });
        })
        .catch(err => {
            // Display error message
            resultP.textContent = 'Erro: ' + err.message;
            // Re-enable inputs to allow correction
            nameInput.disabled = false;
            genderRadios.forEach(r => r.disabled = false);
            drawBtn.disabled = false;
        });
};

// Modal controls for adding new character
addCharBtn.onclick = function () {
    newNameInput.value = '';
    // default to male on opening modal
    document.querySelector('input[name="newGender"][value="M"]').checked = true;
    modal.style.display = 'flex';
};
closeModalBtn.onclick = function () {
    modal.style.display = 'none';
};
window.onclick = function (event) {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};

// Save new character to database
saveCharBtn.onclick = function () {
    const charName = newNameInput.value.trim();
    const charGender = document.querySelector('input[name="newGender"]:checked').value;
    if (!charName) {
        alert('Por favor, insira o nome do personagem');
        return;
    }
    fetch('/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: charName, gender: charGender })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao adicionar personagem');
            }
            return response.json();
        })
        .then(data => {
            alert('Personagem adicionado com sucesso!');
            modal.style.display = 'none';
            // Optionally, update local list and grid
            if (charGender === 'M') {
                maleChars.push(charName);
            } else {
                femaleChars.push(charName);
            }
        })
        .catch(err => {
            alert(err.message);
        });
};

// Initialize the grid on page load with default gender (Male)
updateGrid(document.querySelector('input[name="gender"]:checked').value);
