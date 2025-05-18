// utils/helpers.js

export function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

export function getRandomCharacters(sourceArray, count) {
    if (!Array.isArray(sourceArray) || sourceArray.length === 0) {
        console.warn('Array de origem inválido ou vazio');
        return [];
    }
    const numToPick = Math.min(count, sourceArray.length);
    return shuffleArray(sourceArray).slice(0, numToPick);
}