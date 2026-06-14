interface ResultPanelProps {
  result: string;
}

/** Terminal-style panel that displays the JSON the server returned. */
export function ResultPanel({ result }: ResultPanelProps) {
  return (
    <div className="result">
      <div className="result__bar">
        <span className="result__dot result__dot--r" />
        <span className="result__dot result__dot--y" />
        <span className="result__dot result__dot--g" />
        <span className="result__label">Server response</span>
      </div>
      <pre className="result__body">
        {result || (
          <span className="result__empty">Run a verification to see the server response.</span>
        )}
      </pre>
    </div>
  );
}
