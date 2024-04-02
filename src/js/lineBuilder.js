const linesForm = document.getElementById('linesForm');
const startingGoalie = document.getElementById('startingGoalie');
const backupGoalie = document.getElementById('backupGoalie');
const lineTypes = {
    // Get all select elements for a certain type of line, and converts from a NodeList to an array
    lines: [].slice.call(document.getElementsByClassName('line')),
    PPs: [].slice.call(document.getElementsByClassName('PP')),
    PKs: [].slice.call(document.getElementsByClassName('PK'))
}

/*  Validates one type of line at a time
If a player is selected multiple times in the same type of line, it is invalid
Takes an array of select element as input */
function validateSelection(selects) {
    selects = selects.concat([startingGoalie, backupGoalie]);
    let valid = true;
    let knownValues = [];
    // Get an array of all players that have been selected
    selects.forEach((select, index) => {
        if (select.value != 'noneSelected') {
            knownValues.push(select.value);
        } else {
            selects.slice(index, 1);
        }
    })
    selects.forEach(select => {
        // If a select's value appears more than once, there is a clash, so it is invalid
        if (knownValues.filter(x => x == select.value).length > 1) {
            select.style.backgroundColor = 'lightcoral';
        } else {
            select.style.backgroundColor = 'white';
        }
    })
    return valid;
}

function validateAll() {
    return validateSelection(lineTypes['lines']) && validateSelection(lineTypes['PPs']) && validateSelection(lineTypes['PKs']);
}

// Each time a new selection is made, validate the lines of that type
Object.keys(lineTypes).forEach(type => {
    const validate = () => {
        validateSelection(lineTypes[type]);
    }
    lineTypes[type].forEach(select => {select.addEventListener('change', validate)});
})

// Check all selects whenever a goalie is changed to check if a goalie has also been picked as a skater
startingGoalie.addEventListener('change', validateAll);
backupGoalie.addEventListener('change', validateAll);

linesForm.addEventListener('submit', (e) => {
    e.preventDefault();

    if (validateAll()) {
        linesForm.submit();
    }
})