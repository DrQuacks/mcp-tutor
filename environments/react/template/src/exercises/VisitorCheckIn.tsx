import { useState } from 'react';

// Local, static data for this exercise
const INITIAL_VISITORS:Visitor[] = [
  { id: 1, name: 'Alice Johnson', company: 'Acme Corp', status: 'Not Arrived' },
  { id: 2, name: 'Bob Smith', company: 'Globex Inc', status: 'Checked In' },
  { id: 3, name: 'Carol Lee', company: 'Initech', status: 'Not Arrived' },
];

type VisitorStatus = 'Not Arrived' | 'Checked In' | 'Checked Out';
type Visitor = { id: number; name: string; company: string; status: VisitorStatus };

export default function VisitorCheckIn() {
  // TODO: move INITIAL_VISITORS into state and track a filter value
  const [visitors,setVisitors] = useState(INITIAL_VISITORS)
  // TODO: derive a filtered list based on the selected filter (All / Checked In / Not Arrived)
  // TODO: implement handlers to mark visitors as checked in and checked out using immutable updates

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2>Visitor Check-In</h2>
      {/* TODO: filter controls (All, Checked In, Not Arrived) */}
      {/* TODO: table or list of visitors with actions */}
      <ol>
        {visitors.map(vis => {
            return (<li key={vis.id}>{vis.name}, {vis.company}: {vis.status}</li>)
        })}
      </ol>
    </div>
  );
}
