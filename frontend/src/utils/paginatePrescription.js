/**
 * Splits prescription text into pages depending on a maximum height of the text area.
 * It uses a temporary element in the DOM to perform accurate line-wrapping measurements.
 * 
 * @param {string} text - The raw prescription text to paginate
 * @param {number} maxRxBodyHeight - The maximum allowed height in pixels for the prescription content
 * @returns {string[]} An array of text strings, each representing a single page
 */
export const paginatePrescriptionText = (text, maxRxBodyHeight = 175) => {
    if (!text) return [''];
    const lines = text.split('\n');
    const pages = [];
    let currentPageLines = [];

    // Create a temporary hidden container in the document to measure line heights accurately
    const tempDiv = document.createElement('div');
    // Ensure all styles match the iframe's prescription body
    tempDiv.style.fontFamily = "'Times New Roman', serif";
    tempDiv.style.fontSize = "14px";
    tempDiv.style.lineHeight = "1.5";
    tempDiv.style.width = "330px"; // width of rx-body text area inside the slip
    tempDiv.style.whiteSpace = "pre-wrap";
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.top = "-9999px";
    tempDiv.style.visibility = "hidden";
    tempDiv.style.height = "auto";
    tempDiv.style.padding = "0";
    tempDiv.style.margin = "0";
    tempDiv.style.border = "none";
    document.body.appendChild(tempDiv);

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        currentPageLines.push(line);
        tempDiv.textContent = currentPageLines.join('\n');
        
        if (tempDiv.offsetHeight > maxRxBodyHeight) {
            // If adding this line exceeds the height
            if (currentPageLines.length > 1) {
                // Keep everything except the last line on the current page
                currentPageLines.pop();
                pages.push(currentPageLines.join('\n'));
                currentPageLines = [line];
            } else {
                // Single line itself exceeds the height, push it and start a new page
                pages.push(currentPageLines.join('\n'));
                currentPageLines = [];
            }
        }
    }
    
    if (currentPageLines.length > 0) {
        pages.push(currentPageLines.join('\n'));
    }

    document.body.removeChild(tempDiv);
    return pages;
};

export default paginatePrescriptionText;
