const LABELS = [
  ['overallScore', 'Overall'],
  ['communicationScore', 'Communication'],
  ['pitchScore', 'Pitch'],
  ['objectionScore', 'Objection'],
  ['confidenceScore', 'Confidence'],
  ['closingScore', 'Closing'],
];

export default function ScoreGrid({ assessment }) {
  if (!assessment) return null;
  return (
    <div className="grid cols-3" style={{ marginBottom: 16 }}>
      {LABELS.map(([key, label]) => (
        <div className="card score-tile" key={key}>
          <div className="value">{assessment[key]}</div>
          <div className="label">{label}</div>
        </div>
      ))}
    </div>
  );
}
