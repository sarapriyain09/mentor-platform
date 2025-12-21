import React, { useEffect, useState } from "react";
import { fetchNotes } from "./api";

export default function Demo() {
  const [notes, setNotes] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    fetchNotes()
      .then((data) => {
        if (mounted) setNotes(data);
      })
      .catch((err) => {
        if (mounted) setError(err.message);
      });
    return () => (mounted = false);
  }, []);

  if (error) return <div>Error: {error}</div>;
  return (
    <div>
      <h2>Demo Notes</h2>
      <ul>
        {notes.map((n) => (
          <li key={n.id}>
            <strong>{n.title}</strong>
            <p>{n.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
