const passWithQuotes = '"oavd eamw mppk pepu"';
const passClean = passWithQuotes.replace(/["']|\s+/g, '');

console.log('Original:', passWithQuotes);
console.log('Cleaned:', passClean);

if (passClean === 'oavdeamwmppkpepu') {
    console.log('SUCCESS: Quotes and spaces removed correctly.');
} else {
    console.log('FAILURE: Regex logic is wrong.');
}
