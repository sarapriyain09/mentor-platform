// frontend/src/pages/AIIntakeFlow.jsx
import { useState } from 'react';
import AIIntakeAgent from '../components/AIIntakeAgent';
import AIMatchedMentors from './AIMatchedMentors';

export default function AIIntakeFlow() {
  const [matches, setMatches] = useState(null);

  if (matches !== null) {
    return <AIMatchedMentors matches={matches} />;
  }

  return <AIIntakeAgent onComplete={(matches) => setMatches(matches)} />;
}