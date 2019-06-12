function positionToOffset(position, lineBreakPositions) {
    let lineOffset = 0;
    if (position.line > 1) {
	lineOffset = lineBreakPositions[position.line-2] + 2;
    }
    return lineOffset + position.character-1;
}

module.exports = {

    rangeToSrcLocation: function(range, lineBreakPositions, file=0) {
	const start = positionToOffset(range.start, lineBreakPositions);
	const endOffset = positionToOffset(range.end, lineBreakPositions);
	const length = endOffset - start;
	return {
	    start,
	    length,
	    file,
	    jump: null
	};
    }
}

module.exports.positionToOffset = positionToOffset;
