import { useState } from "react";
import MainPage from "./components/MainPage";
import Join from "./components/Join";

const App = () => {
  const [screen, setScreen] = useState("join");
  const [playerData, setPlayerData] = useState(null);

  if (screen === "main") {
    return <MainPage playerData={playerData} />;
  }

  return <Join setScreen={setScreen} setPlayerData={setPlayerData} />;
};

export default App;
