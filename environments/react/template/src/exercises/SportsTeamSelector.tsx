import { useState } from 'react';

// Teams live in a flat list
const TEAMS = [
  { id: 1, name: 'Lakers' },
  { id: 2, name: 'Warriors' },
  { id: 3, name: 'Celtics' },
  { id: 4, name: 'Bulls' },
  { id: 5, name: 'FC Barcelona' },
  { id: 6, name: 'Real Madrid' },
  { id: 7, name: 'Liverpool' },
  { id: 8, name: 'Manchester City' },
  { id: 9, name: 'Yankees' },
  { id: 10, name: 'Red Sox' },
  { id: 11, name: 'Dodgers' },
  { id: 12, name: 'Patriots' },
  { id: 13, name: 'Chiefs' },
  { id: 14, name: '49ers' },
  { id: 15, name: 'Eagles' },
];

// Sports reference teams by id
const SPORTS = [
  { id: 1, name: 'Basketball', teamIds: [1, 2, 3, 4] },
  { id: 2, name: 'Soccer', teamIds: [5, 6, 7, 8] },
  { id: 3, name: 'Baseball', teamIds: [9, 10, 11] },
  { id: 4, name: 'American Football', teamIds: [12, 13, 14, 15] },
];

type Team = { id: number; name: string };
type Sport = { id: number; name: string; teamIds: number[] };

export default function SportsTeamSelector() {
  // TODO: track which sports are checked and which teams are checked
  // Hint: you can use a Set of ids in state, or a Record<number, boolean> for each level
  // TODO: derive parent checked state from its teams when rendering
  // TODO: implement handlers so parent and child checkboxes stay in sync as described in the exercise

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2>Sports &amp; Teams</h2>
      {/* TODO: render nested checkboxes for sports and teams */}
    </div>
  );
}
