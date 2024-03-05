const linesForm = document.getElementById('linesForm');
const startingGoalie = document.getElementById('startingGoalie');
const backupGoalie = document.getElementById('backupGoalie');
const lineTypes = {
    // Get all select elements for a certain type of line, and convert from a NodeList to an array
    lines: [].slice.call(document.getElementsByClassName('line')),
    PPs: [].slice.call(document.getElementsByClassName('PP')),
    PKs: [].slice.call(document.getElementsByClassName('PK'))
}

// Goalies have their own validation function, as if they are picked to play goalie and any outfield position, their selection is invalid
function validateGoalies() {
    let startingValid = true;
    let backupValid = true;
    // Get all of the select element into 1 array
    const selects = [startingGoalie, backupGoalie].concat(lineTypes['lines'], lineTypes['PPs'], lineTypes['PKs']);
    // Loop through all selects, checking if they match the either of the currently selected goalies
    selects.forEach(select => {
        if (startingValid && select != startingGoalie && select.value != 'noneSelected' && select.value == startingGoalie.value) {
            startingValid = false;
            startingGoalie.style.backgroundColor = 'lightcoral';
        }

        if (backupValid && backupGoalie.value != 'noneSelected' && select != backupGoalie && select.value != 'noneSelected' && select.value == backupGoalie.value) {
            backupValid = false;
            backupGoalie.style.backgroundColor = 'lightcoral';
        }
    })

    if (startingValid) startingGoalie.style.backgroundColor = 'white';
    if (backupValid) backupGoalie.style.backgroundColor = 'white';

    return startingValid && backupValid;
}

startingGoalie.addEventListener('change', validateGoalies);
backupGoalie.addEventListener('change', validateGoalies);

/*  Validates one type of line at a time
    If a player is selected multiple times in the same type of line, it is invalid
    Takes an array of select element as input */
function validateSelection(selects) {
    selects.push(startingGoalie, backupGoalie);
    let valid = true;
    selects.forEach(select => {
        const duplicateFound = selects.some(x => x !== select && x.value != 'noneSelected' && x.value == select.value);
        if (duplicateFound) {
            valid = false;
            select.style.backgroundColor = 'lightcoral';
        } else {
            select.style.backgroundColor = 'white';
        }
    });
    return valid; 
}

linesForm.addEventListener('submit', (e) => {
    e.preventDefault();

    if (validateGoalies() && validateSelection(lineTypes['lines']) && validateSelection(lineTypes['PPs']) && validateSelection(lineTypes['PKs'])) {
        linesForm.submit();
    }
})

// Each time a new selection is made, validate the lines
Object.keys(lineTypes).forEach(type => {
    const validate = () => {
        validateSelection(lineTypes[type]);
    }
    lineTypes[type].forEach(select => {select.addEventListener('change', validate)});
})