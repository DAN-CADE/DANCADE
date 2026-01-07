export type EventGameType = 'rock_paper_scissors' | 'consonant_quiz'; 

interface EventGameProps {
  gameType: EventGameType;
  content: string;
  details: any | undefined;
}

interface ResultProps {
  data: {
    game_type: EventGameType
    details: {
      hint: string, 
      result: string, 
      consonant: string
    }
  }
}

const NEXT_API_URL = process.env.NEXT_API_URL || "http://localhost:3000";
const EVENT_GAME_BASE_URL = `${NEXT_API_URL}/api/event/game`

// Project Info API
export async function getEventGame(): Promise<ResultProps> {
  try {
    const url = `${EVENT_GAME_BASE_URL}`
    const res = await fetch(url);
    const data = await res.json();

    return data;
  } catch (err){
    console.log(err);
    throw err;  
  }
}

export async function createEventGame(eventGame: EventGameProps): Promise<ResultProps> {
  try {
    const url = `${EVENT_GAME_BASE_URL}`
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventGame),
    });
    const data = await res.json();

    return data
  } catch (err){
    console.log(err);
    throw err;  
  }
}