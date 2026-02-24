import { createContext, useContext, useState, type PropsWithChildren } from "react"


export type ExampleContextType = {
  note: string,
  updateNote?: (newNote: string) => void
}
export const ExampleContext = createContext<ExampleContextType>(null!);

export default function ExampleContextProvider({children}: PropsWithChildren<{}>){
  const [note, setNote] = useState("This is an example note");
  return <ExampleContext.Provider value={{
    note: "This is an example note",
    updateNote: (newNote: string) => setNote(newNote)
  }}>
    {children}
  </ExampleContext.Provider>
}

export function useExampleContext(){
  return useContext(ExampleContext);
}