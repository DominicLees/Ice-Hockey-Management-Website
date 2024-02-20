const startingGoalie = document.getElementById('startingGoalie');
const backupGoalie = document.getElementById('backupGoalie');
const lineTypes = {
    lines: [].slice.call(document.getElementsByClassName('line')),
    PPs: [].slice.call(document.getElementsByClassName('PP')),
    PKs: [].slice.call(document.getElementsByClassName('PK'))
}

function validateGoalies() {
    let startingValid = true;
    let backupValid = true;
    const selects = [startingGoalie, backupGoalie].concat(lineTypes['lines'], lineTypes['PPs'], lineTypes['PKs']);
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

Object.keys(lineTypes).forEach(type => {
    const validate = () => {
        validateSelection(lineTypes[type]);
    }
    lineTypes[type].forEach(select => {select.addEventListener('change', validate)});
})