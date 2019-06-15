function lspPositionToOffset(position, lineBreakPositions) {
    let lineOffset = 0;
    if (position.line > 1) {
	lineOffset = lineBreakPositions[position.line-2] + 2;
    }
    return lineOffset + position.character-1;
}

function rangeToLspPosition(range, lineBreakPositions, file=0) {
    const start = lspPositionToOffset(range.start, lineBreakPositions);
    const endOffset = lspPositionToOffset(range.end, lineBreakPositions);
    const length = endOffset - start;
    return {
	start,
	length,
	file,
    };
}

module.exports.LspPositionToOffset = lspPositionToOffset;
module.exports.rangeToLspPosition = rangeToLspPosition;
