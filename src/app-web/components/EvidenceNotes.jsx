import React from 'react';
import UR from '../../system/ursys';
import './EvidenceNotes.css'; // Import the CSS file for styling

class EvidenceNotes extends React.Component {
  handleEvidenceClick = (evNumber, evLetter) => {
    // Convert evNumber to a number
    const evNumberAsNumber = parseInt(evNumber, 10);

    // Check if evLetter is not null and convert it to a number
    const evLetterAsNumber = evLetter !== null ? evLetter.charCodeAt(0) - 96 : null;

    UR.Publish('SHOW_EVIDENCE_LINK', { evId: evLetterAsNumber, rsrcId: evNumberAsNumber });
  };

  render() {
    const { comment } = this.props || '';
    const evidencePattern = /\[Evidence (\d+)([a-z])?\]/gi;

    if (!comment || !comment.text) {
      return null;
    }

    const evidenceMatches = [...comment.text.matchAll(evidencePattern)];

    if (evidenceMatches && evidenceMatches.length > 0) {
      return (
        <div>
          Check out the evidence in this comment:{' '}
          {evidenceMatches.map((match, index) => {
            const evNumber = match[1];
            const evLetter = match[2] || null; // Use null if the letter doesn't exist

            // Check if it's the last button to avoid adding comma and space
            const isLastButton = index === evidenceMatches.length - 1;

            return (
              <React.Fragment key={index}>
                <button
                  className="evidence-link" // Add the CSS class for hyperlink-like style
                  onClick={() => this.handleEvidenceClick(evNumber, evLetter)}
                >
                  {evNumber}
                  {evLetter}
                </button>
                {/* Add comma and space if it's not the last button */}
                {!isLastButton && ', '}
              </React.Fragment>
            );
          })}
        </div>
      );
    } else {
      return (
        <div>
          Consider adding key evidence by writing [Evidence #] where # is the evidence ID you want
          people to look at.
        </div>
      );
    }
  }
}

export default EvidenceNotes;
