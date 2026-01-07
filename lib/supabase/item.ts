const NEXT_API_URL = process.env.NEXT_API_URL || "http://localhost:3000";
const ITEM_BASE_URL = `${NEXT_API_URL}/api/item`

// Project Info API
export async function getItemById(id: string | undefined): Promise<null> {
  try {
    const url = `${ITEM_BASE_URL}?id=${id}`;
    const res = await fetch(url);
    const data = await res.json();

    return data;
  } catch (err){
    console.log(err);
    throw err;  
  }
}

// export async function createEventGame(eventGame: EventGameProps): Promise<ResultProps> {
//   try {
//     const url = `${EVENT_GAME_BASE_URL}`
//     console.log(url)
//     const res = await fetch(url, {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(eventGame),
//     });
//     const data = await res.json();

//     return data
//   } catch (err){
//     console.log(err);
//     throw err;  
//   }
// }