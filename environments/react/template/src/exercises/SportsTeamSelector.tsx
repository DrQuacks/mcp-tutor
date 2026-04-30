import { useState } from 'react';

// Teams live in a flat list
const TEAMS:Team[] = [
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
const SPORTS:Sport[] = [
  { id: 1, name: 'Basketball', teamIds: [1, 2, 3, 4] },
  { id: 2, name: 'Soccer', teamIds: [5, 6, 7, 8] },
  { id: 3, name: 'Baseball', teamIds: [9, 10, 11] },
  { id: 4, name: 'American Football', teamIds: [12, 13, 14, 15] },
];

// const isChecked:IsChecked = TEAMS.reduce((acc,team) => {
//   return {...acc,[team.id]:false}
// },{})

type Team = { id: number; name: string };
type Sport = { id: number; name: string; teamIds: number[] };
type IsChecked = {[key:number]:boolean}
type TotalChecked = {'sports':IsChecked,'teams':IsChecked}
type RowType = 'sports' | 'teams'

function ListRow({name,id,type,handleClick,checked}:{name:string,id:number,type:RowType,handleClick:(id: number,type:RowType) => void,checked:boolean}) {
  return (
    <label>
      <input type='checkbox' checked={checked} onChange={()=>{handleClick(id,type)}}/>
      {name}
    </label>
  )
}

const initialTeamsChecked:IsChecked = TEAMS.reduce((acc,team) => {
    return {...acc,[team.id]:false}
  },{})

const initialSportsChecked:IsChecked = SPORTS.reduce((acc,sport) => {
    return {...acc,[sport.id]:false}
  },{})

export default function SportsTeamSelector() {
  // TODO: track which sports are checked and which teams are checked
  // Hint: you can use a Set of ids in state, or a Record<number, boolean> for each level
  // TODO: derive parent checked state from its teams when rendering
  // TODO: implement handlers so parent and child checkboxes stay in sync as described in the exercise
  const [isChecked,setIsChecked] = useState<TotalChecked>({teams:initialTeamsChecked,sports:initialSportsChecked})

  const handleClick = (id:number,type:RowType) => {
    setIsChecked(prev => {
      const newChecked = !prev[type][id]
      if (type === 'sports') {
        const thisSport = SPORTS.find(sport => sport.id === id)
        if (thisSport) {
          const relevantTeams = thisSport.teamIds
          const newTeamChecked = relevantTeams.reduce<IsChecked>((acc,teamID) => {
            return {...acc,[teamID]:newChecked}
          },{})
          return (
            {sports:{...prev.sports,[id]:newChecked},teams:{...prev.teams,...newTeamChecked}}
          )
        } else {
          return prev
        }
      } else {
        const thisSport = SPORTS.find(sport => sport.teamIds.includes(id))
        if (thisSport) {
          const relevantTeams = thisSport.teamIds
          if (prev.sports[thisSport.id]) {
            return (
              {sports:{...prev.sports,[thisSport.id]:false},teams:{...prev.teams,[id]:false}}
            )
          } else if (!newChecked) {
            return {...prev,teams:{...prev.teams,[id]:newChecked}}
          } else {
            const isFull:boolean = relevantTeams.reduce<boolean>((acc,teamID) => {
              if (!prev.teams[teamID] && teamID !== id) {
                return false
              }
              return acc
            },true)
            if (isFull) {
              return {sports:{...prev.sports,[thisSport.id]:true},teams:{...prev.teams,[id]:true}}
            } else {
              return {...prev,teams:{...prev.teams,[id]:newChecked}}
            }
          }
        } else {
          return prev
        }
      }
    })
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2>Sports &amp; Teams</h2>
      {/* TODO: render nested checkboxes for sports and teams */}
      <ul>
      {SPORTS.map(sport => {
        const includedTeams = TEAMS.filter(team => {
          return sport.teamIds.includes(team.id)
        })
        return(
          <li>
            <ListRow name={sport.name} id={sport.id} type={'sports'} handleClick={handleClick} checked={isChecked.sports[sport.id]}/>
            <ul>
              {includedTeams.map(team => {
                return (
                  <li><ListRow name={team.name} id={team.id} type={'teams'} handleClick={handleClick} checked={isChecked.teams[team.id]}/></li>
                )
              })}
            </ul>
          </li>
        )
      })}
      </ul>
    </div>
  );
}
