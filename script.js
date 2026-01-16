//Configuration
const NUM_CATS = 15;
const SWIPE_THRESHOLD = 100;

//DOM Objects
const cardDeck = document.getElementById("card-deck");
const frontCard = document.getElementById("front-card");
const backCard = document.getElementById("back-card");

//States
let catQueue = [];
let catLikes = [];
let currentIndex = 0;

//Touch tracking
let startX = 0;
let currentX = 0;
let isDragging = false;

//Fetch cat
async function fetchCat() {
    try {
        //Cat pictures sourced from Cataas
        const resolve = await fetch("https://cataas.com/cat?json=true");
        const cat = await resolve.json();

        //Fetch image from JSON
        const img = new Image();
        img.src = cat.url;

        //Load image
        await new Promise(res => {
            img.onload = res;
            img.onerror = res;
        });

        return { ...cat, img };
    } catch(err) {
        console.error("Failed to fetch or preload cat", err);
        return null;
    }
}

//Initialize cards
async function initCards() {
    //Fetch first two images
    const catOne = fetchCat();
    const catTwo  = fetchCat();
    const front = await Promise.race([catOne, catTwo]);

    //Set first image loaded as front card
    frontCard.style.backgroundImage = `url(${front.url})`;
    catQueue.push(front);

    //Set other image as back card
    const back = front === await catOne ? await catTwo : await catOne;
    backCard.style.backgroundImage = `url(${back.url})`;
    catQueue.push(back);

    //Load images for other cats
    for(let i = 0; i < (NUM_CATS - 2); i++) {
        let cat = await fetchCat();

        if(cat !== null)
            catQueue.push(cat);
    }
}

//Update cards after swipe
function updateCards() {
    const front = catQueue[currentIndex];
    const back = catQueue[currentIndex + 1];

    //Return if no cards left
    if(!front)
        return;

    //Transition state
    frontCard.style.transition = "none";
    frontCard.style.transform = "translate(-50%, -50%) rotate(0deg)";
    frontCard.style.opacity = "1";

    //Load current image
    frontCard.style.backgroundImage = `url(${front.url})`;

    //Load next image
    if(back && back.img.complete) {
        backCard.classList.remove("spinner");
        backCard.style.backgroundImage = `url(${back.url})`;
    }
    else if(currentIndex + 1 == NUM_CATS) {
        backCard.classList.remove("spinner");
        backCard.style.backgroundImage = null
    }
    else {
        backCard.style.backgroundImage = null;
        backCard.classList.add("spinner");
    }
}

//Touch Start Handler
function onTouchStart(e) {
    if(e.touches)
        startX = e.touches[0].clientX;
    else
        startX = e.clientX;

    isDragging = true;

    frontCard.style.transition = "none";
}

//Touch Swipe Handler
function onTouchMove(e) {
    if(!isDragging)
        return;

    currentX = e.touches ? e.touches[0].clientX : e.clientX;
    const deltaX = currentX - startX;

    //Animate card
    frontCard.style.transform = `translate(calc(-50% + ${deltaX}px), -50%) rotate(${deltaX / 10}deg)`;

    //Stop scrolling
    e.preventDefault();
}

//Touch End Handler
function onTouchEnd() {
    if(!isDragging)
        return;
    
    isDragging = false;

    const deltaX = currentX - startX;

    //Check if swipe is like or dislike
    if(Math.abs(deltaX) > SWIPE_THRESHOLD) {
        if(deltaX > 0)
            completeSwipe("right");
        else
            completeSwipe("left");
    } else {
        resetCard();
    }
}

//If swipe threshold isn't met, reset position
function resetCard() {
    frontCard.style.transition = "transform 0.3s ease";
    frontCard.style.transform = "translate(-50%, -50%) rotate(0deg)";
}

//Register swipe as like or dislike
function completeSwipe(direction) {
    if(direction === "right")
        catLikes[currentIndex] = true;
    else
        catLikes[currentIndex] = false;

    //Swipe animations
    frontCard.style.transition = "transform 0.3s ease, opacity 0.3s ease";
    frontCard.style.transform = `translate(${direction === "right" ? "150%" : "-150%"}, -50%) rotate(30deg)`;
    frontCard.style.opacity = "0";

    //Wait for animation to complete
    setTimeout(() => {
        currentIndex++;
        updateCards();

        //Check if all cats have been swiped
        if(currentIndex >= NUM_CATS)
            showLikedCats();
    }, 300);
}

//Show liked cats
function showLikedCats() {
    const results = document.getElementById("results");
    const likedCats = document.getElementById("liked-cats");
    const likedNum = document.getElementById("liked-num");

    //Clear any previous content
    likedCats.innerHTML = "";
    likedNum.innerHTML = "0";

    //Loop through catQueue and catLikes
    for(let i = 0; i < catQueue.length; i++) {
        if(catLikes[i]) {
            const img = document.createElement("img");
            img.src = catQueue[i].url;
            likedCats.appendChild(img);
            likedNum.innerHTML = parseInt(likedNum.innerHTML) + 1;
        }
    }

    //Hide card deck and show results
    document.getElementById("card-deck").style.display = "none";
    results.style.display = "block";
}

//Event listeners for touch devices
frontCard.addEventListener("touchstart", onTouchStart, { passive: false });
frontCard.addEventListener("touchmove", onTouchMove, { passive: false });
frontCard.addEventListener("touchend", onTouchEnd);

//Event listeners for mouse devices
frontCard.addEventListener("mousedown", onTouchStart);
document.addEventListener("mousemove", onTouchMove);
document.addEventListener("mouseup", onTouchEnd);

initCards().then(() => {
    updateCards();
});